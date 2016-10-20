var express = require("express");
var mailgun = require("mailgun-js");
var env = require("./env.json");

var app = express();
var mailer = mailgun.client({
	username: "api",
	key: env.api_key
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
	mailer.send(data, function(error, body){
		console.log(arguments);
	});
	res.send("poot");
});

app.listen("3000", function(){
  console.log("Mailer is running.");
});
