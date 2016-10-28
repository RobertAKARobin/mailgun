var express = require("express");
var mailgun = require("mailgun-js");
var bodyParser = require("body-parser");
var request = require("request");
var querystring = require("querystring");
var env = require("./env.json");

var app = express();
var mailgun = mailgun({
  apiKey: env.api_key,
  domain: env.domain
});

app.enable("trust proxy", true);
app.use(bodyParser.json());
app.use(function setHeaders(req, res, next){
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
  res.setHeader("Access-Control-Allow-Origin", env.origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(function getEmail(req, res, next){
  req.email = (req.body.email || req.query.email || (req.body.contact || {}).email);
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
    if(body.is_valid){
      next();
    }else{
      res.json({success: false, error: "Something's wrong with your e-mail."});
    }
  });
});

app.get("/", function(req, res){
  res.json({success: true, email: req.email});
});

app.post("/send", function(req, res){
  var contact = req.body.contact;
  var attachment = attach(req.email + ".json", req.body);
  var data = {
    from: env.name + " <" + env.email + ">",
    to: req.email,
    cc: env.email,
    subject: "This is a test e-mail!",
    text: "Hi " + (contact.name || "there") + "! This is an e-mail.",
    attachment: attachment
  };
  mailgun.messages().send(data, function(error, body){
    if(error){
      res.json({success: false, error: "Something went wrong! Try again later."});
    }else{
      res.send({success: true});
    }
  });
});

app.post("/apps_a_la_carte", function(req, res){
  var hs_context = {
    hutk: req.body.hubspotutk,
    ipAddress: req.headers['x-real-ip'] || req.connection.remoteAddress,
    pageUrl: (req.headers.referrer || req.headers.referer),
    pageName: "Apps a la Carte"
  };
  var postData = {
    email: req.body.email,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    description: req.body.description,
    hs_context: JSON.stringify(hs_context)
  };
  var requestOptions = {
    uri: "https://forms.hubspot.com/uploads/form/v2/" + env.hs.portalId + "/" + env.hs.formId,
    form: postData,
    method: "POST"
  };
  request.post(requestOptions, function(error, response, body){
    if(error){
      res.json({error: error.message});
    }else{
      res.json({success: true});
    }
  });
});

app.listen("3002", function(){
  console.log("Mailer is running.");
});

function attach(filename, text){
  return new mailgun.Attachment({
    data: new Buffer(JSON.stringify(text, null, 2), "utf8"),
    filename: filename + ".txt",
    contentType: "text/plain"
  });
}
