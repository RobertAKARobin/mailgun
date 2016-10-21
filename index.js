var express = require("express");
var mailgun = require("mailgun-js");
var bodyParser = require("body-parser");
var env = require("./env.json");

var app = express();
var mailer = mailgun({
  apiKey: env.api_key,
  domain: env.domain
});

app.use(function(req, res, next){
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
  // res.setHeader("Access-Control-Allow-Origin", "http://www.robertakarobin.com/apps_a_la_carte");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(bodyParser.json());

app.get("/", function(req, res){
  res.send("Not much here.");
});

app.post("/send", function(req, res){
  var contact = req.body.contact,
    attachment,
    data;
  if(!contact.email){
    return err("Please include an e-mail address.");
  }
  try{
    attachment = new mailer.Attachment({
      data: new Buffer(JSON.stringify(req.body, null, 2), "utf8"),
      filename: contact.email + ".json.txt",
      contentType: "text/plain"
    });
    data = {
      from: env.name + " <" + env.email + ">",
      to: contact.email,
      cc: env.email,
      subject: "Apps a la Carte!",
      text: "Hi " + (contact.name || "there") + "! Looks like you just submitted the form at robertakarobin.com/apps_a_la_carte. I'll respond as soon as I can!",
      attachment: attachment
    };
  }catch(error){
    return err("Something's weird with the data you sent.");
  }
  try{
    mailer.messages().send(data, function(error, body){
      if(error){
        throw error;
      }else{
        res.send({success: true});
      }
    });
  }catch(error){
    return err(error);
  }

  function err(error){
    console.log(error);
    res.status(400).json({success:false, error: (error.message || error)});
  }
});

app.listen("3002", function(){
  console.log("Mailer is running.");
});

