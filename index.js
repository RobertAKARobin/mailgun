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

app.use(bodyParser.json());
app.use(function setHeaders(req, res, next){
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
  // res.setHeader("Access-Control-Allow-Origin", "http://www.robertakarobin.com/apps_a_la_carte");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(function getEmail(req, res, next){
  req.email = (req.query || req.body.contact || {}).email;
  next();
});
app.use(function validateEmail(req, res, next){
  var params = {
    url: "https://api.mailgun.net/v3/address/validate",
    qs: {
      address: req.email,
      api_key: env.validation_key
    }
  }
  request.get(params, function(error, response, body){
    var body = JSON.parse(body || "{}");
    if(response.statusCode > 200 || !body.is_valid){
      return report(res, "Something's wrong with your email.");
    }else next();
  });
});

app.get("/", function(req, res){
  res.json({success: true, email: req.email});
});

app.post("/send", function(req, res){
    var contact = req.body.contact;
    var attachment = new mailer.Attachment({
      data: new Buffer(JSON.stringify(req.body, null, 2), "utf8"),
      filename: req.email + ".json.txt",
      contentType: "text/plain"
    });
    var data = {
      from: env.name + " <" + env.email + ">",
      to: req.email,
      cc: env.email,
      subject: "Apps a la Carte!",
      text: "Hi " + (contact.name || "there") + "! Looks like you just submitted the form at robertakarobin.com/apps_a_la_carte. I'll respond as soon as I can!",
      attachment: attachment
    };
    try{
      mailer.messages().send(data, function(error, body){
        if(error) throw error;
        else res.send({success: true});
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
