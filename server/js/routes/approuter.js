var express = require("express");
var approot = require("app-root-path");
var router = express.Router();

router.get("/", function (req, res){
	res.sendFile(approot + "/index.html");
});

router.get(/.*/, function(req, res){
	res.status(400).sendFile(approot + "/client/views/default404.html");
});

module.exports = router;