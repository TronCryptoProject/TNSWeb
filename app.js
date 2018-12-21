argv = require('minimist')(process.argv.slice(2));
require("env2")("./.env");

var AppRoot = require("app-root-path");
var Express = require("express");
var BodyParser = require("body-parser");
var GlobalConfig = require(AppRoot + "/GlobalConfig.js");
global.GlobalConfig = GlobalConfig;

var AppRouter = require(AppRoot + "/server/js/routes/AppRouter.js");
var ApiRouter = require(AppRoot + "/server/js/routes/ApiRouter.js");


if (!("network" in argv)){
	console.log("Please specify network");
	process.exit(1);
}


var app = Express();

app.use("/style", Express.static(AppRoot + "/client/style"));
app.use("/js", Express.static(AppRoot + "/client/js"));
app.use("/bundle", Express.static(AppRoot + "/bundle"));
app.use("/images", Express.static(AppRoot + "/client/images"));
app.use("/fonts", Express.static(AppRoot + "/client/fonts"));

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended:true}));


//register the express router
app.use("/api", ApiRouter);
app.use("/favicon.ico", function(req,res){
	res.sendFile(AppRoot + "/favicon.ico");
});
app.use("/", AppRouter);

var port = 3000;
app.listen(port, function(){
	console.log("Node server running @ http://localhost:" + port)
});
