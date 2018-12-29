var TronWeb = require("tronweb");

const network_type = argv.network.trim();
var tronWeb;

function instantiate(){
    if (!tronWeb){
        tronWeb = new TronWeb(
            GlobalConfig.network[network_type].fullNode,
            GlobalConfig.network[network_type].solidityNode,
            GlobalConfig.network[network_type].eventServer,
            GlobalConfig.privateKey[network_type]
        );
    }
    return tronWeb;
}
module.exports = instantiate();