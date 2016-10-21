var express = require("express");
var mailgun = require("mailgun-js");
var bodyParser = require("body-parser");
var request = require("request");
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

app.post("/send",
  function validateEmail(req, res, next){
    var contact = req.body.contact;
    var params = {
      url: "https://api.mailgun.net/v3/address/validate",
      form: {
        address: contact.email,
        api_key: env.validation_key
      }
    }
    request.get(params, function(error, response, body){
      if(response.statusCode > 200){
        return report(res, "Something's wrong with your email.");
      }else next();
    });
  },
  function prepEmail(req, res, next){
    var contact = req.body.contact;
    var attachment = new mailer.Attachment({
      data: new Buffer(JSON.stringify(req.body, null, 2), "utf8"),
      filename: contact.email + ".json.txt",
      contentType: "text/plain"
    });
    var data = {
      from: env.name + " <" + env.email + ">",
      to: contact.email,
      cc: env.email,
      subject: "Apps a la Carte!",
      text: "Hi " + (contact.name || "there") + "! Looks like you just submitted the form at robertakarobin.com/apps_a_la_carte. I'll respond as soon as I can!",
      attachment: attachment
    };
    req.email = data;
    next();
  },
  function send(req, res){
    try{
      mailer.messages().send(req.email, function(error, body){
        if(error){
          throw error;
        }else{
          res.send({success: true});
        }
      });
    }catch(error){
      return report(res, error);
    }
  }
);

app.listen("3002", function(){
  console.log("Mailer is running.");
});

function report(res, error){
  console.log(error);
  res.status(400).json({success:false, error: (error.message || error)});
}
