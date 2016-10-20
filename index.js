var express = require("express");
var mailgun = require("mailgun-js");
var env = require("./env.json");

var app = express();
var mailer = mailgun({
	apiKey: env.api_key,
	domain: env.domain
});

app.get("/", function(req, res){
  res.send("Not much here.");
});

app.get("/send", function(req, res){
	var data = {
		from: "Bob Dole <foo@bar.com>",
		to: env.email,
		subject: "Test1",
		text: "It is " + Date.now()
	};
	mailer.messages().send(data, function(error, body){
		console.log(arguments);
	});
	res.send("poot");
});

app.listen("3000", function(){
  console.log("Mailer is running.");
});
