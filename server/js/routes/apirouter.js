var express = require("express");
var router = express.Router();

router.get(/.*/,function(req, res){
	res.status(400).json({"error": "Invalid query"});
});

module.exports = router;