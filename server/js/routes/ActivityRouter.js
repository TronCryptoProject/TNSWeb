var Express = require("express");
var Router = Express.Router();
var ActivityController = require("./../api/ActivityController.js");

Router.get("/activity/:owner", ActivityController.getOwnerTxActivity);
Router.post("/txStore", ActivityController.storeTx);
Router.get("/txs/:aliasOwner", ActivityController.getTxs);

Router.get(/.*/,function(req, res){
	res.status(400).json({"error": "Invalid query"});
});

module.exports = Router;