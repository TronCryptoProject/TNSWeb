var AppRoot = require("app-root-path");
var ApiConfig = require(AppRoot + "/server/config/api.json");
var Injecter = require(AppRoot + "/injecter.json");
var tronWeb = require("./TronWebInst.js");
var to = require('await-to-js').default;

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
global.isZeroAddress = function(address){
    if (address == "410000000000000000000000000000000000000000") return true;
    return false;
}

global.createErrorJSON = function(val = ""){
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
global.createResJSON = function(val){
    return {result: val};
}

global.keccak256 = function(itemList){
    var res_list = [];
    for (var item of itemList){
        res_list.push(tronWeb.sha3(item));
    }
    return res_list;
}

global.contractCall = function(contractFunc, args){
    return new Promise((resolve,reject)=>{
        try{
            tronWeb.contract().at(TNSContractAddress).then(contract=>{
                contract[contractFunc](...args).call().then(result=>{
                    resolve(result);
                }).catch(e=>{
                    console.log(e);
                    reject(e);
                });
            });            
        }catch(e){
            reject(e);
        }
    });
}

function getConditionedArgs(isRaw, argsList){
    if (!isRaw){
        isRaw = "true";
    }
    isRaw = isRaw.toLowerCase();
    if (String(isRaw) == "true"){
        return keccak256(argsList);
    }
    return argsList;
}

//for 'default' tag, you don't have to set ?raw=true in request
function getAliasTagArgs(isRaw,alias,tag){
    tag = tag.toLowerCase();
    var args = [];
    if (tag == "default"){
        var cond_args = getConditionedArgs(isRaw, [alias]);
        tag = keccak256([tag]);
        args = [...cond_args, ...tag];
    }else{
        args = getConditionedArgs(isRaw, [alias,tag]);
    }
    return args;
}

exports.resolveAliasTag = async function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    try{
        preCheck([alias,tag]);
        var args = getConditionedArgs(req.query.raw, [alias,tag]);
        console.log("resolved args: ", args);
        
        var [err, secretResult] = await to(contractCall("getIsTagSecret", args));
        if (err) throw err;
        
        if (secretResult == true){
            res.json(createResJSON(""));
        }else{
            var [err, genFlagResult] = await to(contractCall("getGenAddressFlag", args));
            if (err) throw err;
            if (genFlagResult == false){
                var [err, pubAddressResult] = await to(contractCall("getPubAddressForTag", args));
                if (err) throw err;
                res.json(createResJSON(isZeroAddress(pubAddressResult)?"":pubAddressResult));
            }else{
                getNextGenAddress(alias,tag,req.query.raw).then(genAddress=>{
                    res.json(createResJSON(isZeroAddress(genAddress)?"":genAddress))
                }).catch(e=>{
                    throw e;
                });
            }
        }
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.isAliasAvailable = function(req,res){
    var alias = req.params.alias;
    
    try{
        preCheck([alias]);
        var args = getConditionedArgs(req.query.raw, [alias]);
        contractCall("isAliasAvailable", args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.isTagAvailable = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    try{
        preCheck([alias,tag]);
        var args = getConditionedArgs(req.query.raw, [alias,tag]);
        contractCall("isTagAvailable",args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

//Need to decrypt the aliases with password in a second request to get the actual string back
exports.getAliasesForOwner = function(req,res){
    var owner_address = req.params.owner;

    try{
        preCheck([owner_address]);
        if (tronWeb.isAddress(owner_address)){
            contractCall("getAliasesForOwner",owner_address).then(result=>{
                res.json(createResJSON(result));
            }).catch(e=>{
                throw e;
            });
        }else{
            throw ApiConfig.errors.INVALID_PARAM;
        }
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getAliasOwner = function(req,res){
    var alias = req.params.alias;

    try{
        preCheck([alias]);
        var args = getConditionedArgs(req.query.raw, [alias]);
        contractCall("getAliasOwner", args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getAllTagsForAlias = function(req,res){
    var alias = req.params.alias;

    try{
        preCheck([alias]);
        var args = getConditionedArgs(req.query.raw, [alias]);
        contractCall("getAllTagsForAlias",args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getTagDataForTag = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;

    try{
        preCheck([alias,tag]);
        var args = getConditionedArgs(req.query.raw, [alias,tag]);
        contractCall("getTagDataForTag",args).then(resultList=>{
            var res_json = {
                "generatorFlag": resultList[0],
                "isSecret": resultList[1],
                "genAddressList": resultList[2],
                "secretMembers": resultList[3],
                "tagPubAddress": resultList[4]
            };
            res.json(createResJSON(res_json));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getAllAliasInfo = async function(req,res){
    var owner_address = req.params.owner;
    var res_dict = {};

    try{
        preCheck([owner_address]);
        if (tronWeb.isAddress(owner_address)){
            var [err, aliasList] = await to(contractCall("getAliasesForOwner", [owner_address]));
            if (err) throw err;
            console.log(aliasList);
            for (var alias of aliasList){
                var [err, encAlias] = await to(contractCall("getEncryptedAliasForKeccak",[alias]));
                if (err) throw err;
                
                res_dict[encAlias] = {};
                var [err, tagList] = await to(contractCall("getAllTagsForAlias",[alias]));
                if (err) throw err;
            
                for (var tag of tagList){
                    var [err, encTag] = await to(contractCall("getEncryptedTagForKeccak",[alias,tag]));
                    if (err) throw err;
                    
                    var [err, tagDataList] = await to(contractCall("getTagDataForTag",[alias,tag]));
                    if (err) throw err;
                    var tag_data_json = {
                        "generatorFlag": tagDataList[0],
                        "isSecret": tagDataList[1],
                        "genAddressList": tagDataList[2],
                        "secretMembers": tagDataList[3],
                        "tagPubAddress": tagDataList[4]
                    };
                    res_dict[encAlias][encTag] = tag_data_json;
                }
            }
            res.json(createResJSON(res_dict));
        }else{
           throw ApiConfig.errors.INVALID_PARAM;
        }
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getGenAddressList = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;
    var is_raw = req.query.raw? req.query.raw : "true";

    try{
        preCheck([alias,tag]);
        var args = getAliasTagArgs(is_raw,alias,tag);
        
        contractCall("getGenAddressList",args).then(resultList=>{
            res.json(createResJSON(resultList));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getGenAddressListLen = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;
    var is_raw = req.query.raw? req.query.raw : "true";

    try{
        preCheck([alias,tag]);
        var args = getAliasTagArgs(is_raw,alias,tag);
        
        contractCall("getGenAddressListLen",args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getPubAddress = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;
    var is_raw = req.query.raw? req.query.raw : "true";

    try{
        preCheck([alias,tag]);
        var args = getAliasTagArgs(is_raw,alias,tag);
        contractCall("getPubAddressForTag",args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getGenAddressFlag = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;
    var is_raw = req.query.raw? req.query.raw : "true";

    try{
        preCheck([alias,tag]);
        var args = getAliasTagArgs(is_raw,alias,tag);
        contractCall("getPubAddressForTag",args).then(result=>{
            res.json(createResJSON(result));
        }).catch(e=>{
            throw e;
        });
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
}

function getNextGenAddress(alias, tag, isRaw){
    return new Promise((resolve,reject)=>{
        //assumes checks for listLen > 0 are previously done
        function getListNextIdx(listLen){
            var key = alias + "-" + tag;
            if (key in genAddressListIdxDict){
                var idx = genAddressListIdxDict[key]
                genAddressListIdxDict[key] = (idx + 1) % listLen;
            }else{
                genAddressListIdxDict[key] = 0;
            }
            return genAddressListIdxDict[key];
        }
        
        try{
            preCheck([alias,tag]);
            var args = getAliasTagArgs(isRaw,alias,tag);
            contractCall("getGenAddressListLen",args).then(genNumElems=>{
                if (genNumElems < 1){
                    reject(ApiConfig.errors.NO_ADDRESS_FOUND);
                }
                var next_idx = getListNextIdx(genNumElems);
                contractCall("getGenAddressForTag",[...args,next_idx]).then(genAddress=>{
                    resolve(genAddress);
                }).catch(e=>{
                    reject(e);
                });
            }).catch(e=>{
                reject(e);
            });
        }catch(e){
            reject(e);
        }
    });
}
exports.getNextGenAddress = function(req,res){
    var alias = req.params.alias;
    var tag = req.params.tag;
    var is_raw = req.query.raw? req.query.raw : "true";

    getNextGenAddress(alias,tag,is_raw).then(genAddress=>{
        res.json(createResJSON(genAddress))
    }).catch(e=>{
        res.status(400).json(createErrorJSON(e));
    });
    
}
