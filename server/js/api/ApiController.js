var AppRoot = require("app-root-path");
var ApiConfig = require(AppRoot + "/server/config/api.json");
var Injecter = require(AppRoot + "/injecter.json");
var TronWeb = require("tronweb");
var to = require('await-to-js').default;

const network_type = argv.network.trim();
const tronWeb = new TronWeb(
    GlobalConfig.network[network_type].fullNode,
    GlobalConfig.network[network_type].solidityNode,
    GlobalConfig.network[network_type].eventServer,
    GlobalConfig.privateKey[network_type]
);
const TNSContractAddress = Injecter["TNS"]["address"];
var genAddressListIdxDict = {};


async function isTronWebConnected(){
    return await tronWeb.isConnected();
}

function preCheck(itemArray){
    if (isTronWebConnected()){
        for (var item of itemArray){
            item = item.trim();
            if (item == undefined || item == ""){
                throw ApiConfig.errors.INVALID_PARAM;
            }
        }
    }else{
        throw ApiConfig.errors.TRONWEB_NOT_CONNECTED;
    }
}

function createErrorJSON(val = ""){
    var errorMsg = val;
    if (val.constructor == Object){
        var dirty = false;
        for(var e of ["error", "ERROR", "Error"]){
            if (e in val){
                errorMsg = val[e];
                dirty = true;
                break;
            }
        }
        if (!dirty){
            try{
                errorMsg = JSON.stringify(val);
            }catch(e){
                errorMsg = val.toString();
            }
        }
    }
    
    return {error: errorMsg};
}
function createResJSON(val){
    return {result: val};
}

function keccak256(itemList){
    var res_list = [];
    for (var item of itemList){
        res_list.push(tronWeb.sha3(item));
    }
    return res_list;
}

function contractCall(contractFunc, args){
    return new Promise((resolve,reject)=>{
        try{
            tronWeb.contract().at(TNSContractAddress).then(contract=>{
                contract[contractFunc](...args).call().then(result=>{
                    resolve(result);
                }).catch(e=>{
                    throw e;
                });
            });            
        }catch(e){
            reject(e);
        }
    });
}

function getConditionedArgs(isRaw, argsList){
    if (isRaw){
        isRaw = isRaw.toLowerCase();
        if (String(isRaw) == "true"){
            return keccak256(argsList);
        }
    }
    return argsList;
}

//for 'default' tag, you don't have to set ?raw=true in request
function getAliasTagArgs(req,alias,tag){
    tag = tag.toLowerCase();
    var args = [];
    if (tag == "default"){
        var cond_args = getConditionedArgs(req.query.raw, [alias]);
        tag = keccak256([tag]);
        args = [...cond_args, ...tag];
    }else{
        args = getConditionedArgs(req.query.raw, [alias,tag]);
    }
    return args;
}

exports.isAliasAvailable = function(req,res){
    var alias = req.params.alias;

    preCheck([alias]);
    var args = getConditionedArgs(req.query.raw, [alias]);
    contractCall("isAliasAvailable", args).then(result=>{
        res.json(createResJSON(result));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.isTagAvailable = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getConditionedArgs(req.query.raw, [alias,tag]);
    contractCall("isTagAvailable",args).then(result=>{
        res.json(createResJSON(result));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

//Need to decrypt the aliases with password in a second request to get the actual string back
exports.getAliasesForOwner = function(req,res){
    var owner_address = req.params.owner;

    preCheck([owner_address]);
    if (tronWeb.isAddress(owner_address)){
        contractCall("getAliasesForOwner",owner_address).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            res.status(400).json(createErrorJSON(e));
        });
    }else{
        res.status(400).json(ApiConfig.errors.INVALID_PARAM);
    }
}

exports.getAllTagsForAlias = function(req,res){
    var alias = req.params.alias;

    preCheck([alias]);
    var args = getConditionedArgs(req.query.raw, [alias]);
    contractCall("getAllTagsForAlias",args).then(result=>{
        res.json(createResJSON(result));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.getTagDataForTag = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getConditionedArgs(req.query.raw, [alias,tag]);
    contractCall("getTagDataForTag",args).then(resultList=>{
        var res_json = {
            "generatorFlag": resultList[0],
            "genAddressList": resultList[1],
            "tagPubAddress": resultList[2]
        };
        res.json(createResJSON(res_json));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.getAllAliasInfo = async function(req,res){
    var owner_address = req.params.owner;
    var res_dict = {};

    preCheck([owner_address]);
    if (tronWeb.isAddress(owner_address)){
        try{
            var [err, aliasList] = await to(contractCall("getAliasesForOwner", [owner_address]));
            if (err) throw err;
            console.log(aliasList);
            for (var alias of aliasList){
                var [err, encAlias] = await to(contractCall("getEncryptedAliasForKeccak",[alias]));
                if (err) throw err;

                var [err, tagList] = await to(contractCall("getAllTagsForAlias",[alias]));
                if (err) throw err;
               
                for (var tag of tagList){
                    var [err, encTag] = await to(contractCall("getEncryptedTagForKeccak",[alias,tag]));
                    if (err) throw err;
                    
                    var [err, tagDataList] = await to(contractCall("getTagDataForTag",[alias,tag]));
                    if (err) throw err;
                    var res_json = {
                        "generatorFlag": tagDataList[0],
                        "genAddressList": tagDataList[1],
                        "tagPubAddress": tagDataList[2]
                    };

                    if (!(encAlias in res_dict)){
                        res_dict[encAlias] = {};
                    }
                    res_dict[encAlias][encTag] = res_json;
                }
            }
            res.json(createResJSON(res_dict));
        }catch(e){
            res.status(400).json(createErrorJSON(e));
        }
           
    }else{
        res.status(400).json(ApiConfig.errors.INVALID_PARAM);
    }
}

exports.getGenAddressList = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getAliasTagArgs(req,alias,tag);
    
    contractCall("getGenAddressList",args).then(resultList=>{
        res.json(createResJSON(resultList));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.getGenAddressListLen = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getAliasTagArgs(req,alias,tag);
    
    contractCall("getGenAddressListLen",args).then(result=>{
        res.json(createResJSON(result));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.getPubAddress = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getAliasTagArgs(req,alias,tag);
    contractCall("getPubAddressForTag",args).then(result=>{
        res.json(createResJSON(result));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.getGenAddressFlag = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getAliasTagArgs(req,alias,tag);
    contractCall("getPubAddressForTag",args).then(result=>{
        res.json(createResJSON(result));
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}

exports.getNextGenAddress = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    preCheck([alias,tag]);
    var args = getAliasTagArgs(req,alias,tag);

    //assumes checks for listLen > 0 are previously done
    function getListNextIdx(listLen){
        var key = alias + "-" + tag;
        if (key in genAddressListIdxDict){
            var idx = getNextGenAddressForTag[key]
            getNextGenAddressForTag[key] = (idx + 1) % listLen;
        }else{
            getNextGenAddressForTag[key] = 0;
        }
        return getNextGenAddressForTag[key];
    }
    
    contractCall("getGenAddressListLen",args).then(genNumElems=>{
        if (genNumElems < 1){
            throw ApiConfig.errors.NO_ADDRESS_FOUND;
        }
        var next_idx = getListNextIdx(genNumElems);
        contractCall("getGenAddressForTag",[...args,next_idx]).then(genAddress=>{
            res.json(createResJSON(genAddress));
        }).catch(e=>{
            throw e;
        });
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
}
