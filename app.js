var approot = require("app-root-path");
var express = require("express");
var bodyparser = require("body-parser");
var approuter = require(approot + "/server/js/routes/approuter.js");
var apirouter = require(approot + "/server/js/routes/apirouter.js");

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));


//register the express router
app.use("/api", apirouter);
/*app.use("/favicon.ico", function(req,res){
	res.sendFile(approot + "/favicon.ico");
});*/
app.use("/", approuter);

var port = 3000;
app.listen(port, function(){
	console.log("Node server running @ http://localhost:" + port)
});
