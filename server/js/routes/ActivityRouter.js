var Express = require("express");
var Router = Express.Router();
var ActivityController = require("./../api/ActivityController.js");

Router.get("/activity/:owner", ActivityController.getOwnerActivity);

Router.get(/.*/,function(req, res){
	res.status(400).json({"error": "Invalid query"});
});

module.exports = Router;