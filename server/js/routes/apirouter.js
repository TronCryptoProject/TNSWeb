var Express = require("express");
var Router = Express.Router();
var ApiController = require("./../api/ApiController.js");

Router.get("/aliasAvailable/:alias", ApiController.isAliasAvailable);
Router.get("/tagAvailable/:alias/:tag", ApiController.isTagAvailable);
Router.get("/aliases/:owner", ApiController.getAliasesForOwner);
Router.get("/aliasOwner/:alias", ApiController.getAliasOwner);
Router.get("/tags/:alias", ApiController.getAllTagsForAlias);
Router.get("/tagInfo/:alias/:tag", ApiController.getTagDataForTag);
Router.get("/allAliasInfo/:owner", ApiController.getAllAliasInfo);

Router.get("/genAddressList/:alias/:tag", ApiController.getGenAddressList);
Router.get("/genAddressListLen/:alias/:tag", ApiController.getGenAddressListLen);
Router.get("/pubAddress/:alias/:tag", ApiController.getPubAddress);
Router.get("/genAddressFlag/:alias/:tag", ApiController.getGenAddressFlag);
Router.get("/genNextAddress/:alias/:tag", ApiController.getNextGenAddress);

Router.get(/.*/,function(req, res){
	res.status(400).json({"error": "Invalid query"});
});

module.exports = Router;