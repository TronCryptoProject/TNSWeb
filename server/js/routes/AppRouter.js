var Express = require("express");
var AppRoot = require("app-root-path");
var Router = Express.Router();

Router.get("/APIBlueprint.html", function (req, res){
	res.sendFile(AppRoot + "/APIBlueprint.html");
});

Router.get("/", function (req, res){
	res.sendFile(AppRoot + "/index.html");
});

Router.get(/.*/, function(req, res){
	res.status(400).sendFile(AppRoot + "/client/views/default404.html");
});

module.exports = Router;