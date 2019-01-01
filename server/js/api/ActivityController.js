var AppRoot = require("app-root-path");
var ApiConfig = require(AppRoot + "/server/config/api.json");
var tronWeb = require("./TronWebInst.js");
var Injecter = require(AppRoot + "/injecter.json");
var to = require('await-to-js').default;
var format = require("string-format");
format.extend(String.prototype);

const TNSContractAddress = Injecter["TNS"]["address"];
var methodSigns = {};
var txCache = {};
var paramIdx = {}; //{"[func_name]": {"aliasName":0, "tagName":5}}
var paramInjected = new Set(["aliasName", "newAliasName", "tagName", "newTagName", "oldEncryptedAlias",
    "oldEncryptedTag"]);
var zeroBytes32 = "0x";
zeroBytes32 = zeroBytes32.padEnd(66,"0");

function addressToHex(address){
    if (address){
        if (address.startsWith("0x")){
            address = address.replace(/^0x/gi,"41");
        }else if (address.startsWith("T")){
            return tronWeb.address.toHex(address);
        }
        return tronWeb.address.fromHex(address);
    }
}

function parseUnixTimestamp(timestamp){
    var date = new Date(timestamp);
    return "{0} ({1})".format(date.toLocaleDateString(), date.toLocaleTimeString());
}
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

function getActionStr(entities, funcName){
    var base_str = ApiConfig.contractFuncAction[funcName];

    var removeWords = function(entity, removeInstructions){
        for (var instruction of removeInstructions){
            var inst_regex = instruction.match(/^([a-z]+)(.*)/);
            var num_to_remove = inst_regex[2];
            switch(inst_regex[1]){
                case "l":
                    var regex = `(\\w+\\s+){${num_to_remove}}(?=\\{${entity}\\})`;
                    base_str = base_str.replace(new RegExp(regex), "");
                    break;
                case "r":
                    var regex = `(?<=\\{${entity}\\})(\\s+\\w+){${num_to_remove}}`;
                    base_str = base_str.replace(new RegExp(regex), "");
                    break;
                case "lc":
                    var regex = `(.){${num_to_remove}}(?=\\{${entity}\\})`;
                    base_str = base_str.replace(new RegExp(regex), "");
                    break;
                case "rc":
                    var regex = `(?<=\\{${entity}\\})(.){${num_to_remove}}`;
                    base_str = base_str.replace(new RegExp(regex), "");
                    break;
            }
        }
       
        base_str = base_str.replace(`{${entity}}`, "");
        if (funcName.toLowerCase().startsWith("update")){
            if (entity == "aliasName"){
                base_str += " tag";
            }else if (entity == "tagName"){
                base_str += " alias";
            }
        }
        return base_str;
    }

    for (var entity in entities){
        if (entities[entity] == zeroBytes32){
            if (funcName in ApiConfig.funcActionRemoveWords && entity in 
                ApiConfig.funcActionRemoveWords[funcName]){
                var remove_instructions = ApiConfig.funcActionRemoveWords[funcName][entity];
                removeWords(entity, remove_instructions);
            }else{
                removeWords(entity, []);
            }
        }
    }

    str_list = base_str.split(" ");
    var res_str = [];
    for (var word of str_list){
        if (word != ""){
            res_str.push(word);
        }
    }
    return res_str.join(" ");
}

function fetchEncryptedDataforKeccak(entities){
    console.log("ENTITIES", entities);
    return new Promise((resolve, reject)=>{
        var res_entities = {};
        var promise_list = [];
        for (var entity in entities){
            promise_list.push(entity);
            var entity_val = "0x" + entities[entity];
            if (entity != "oldEncryptedAlias" && entity != "oldEncryptedTag"){
                console.log("kk: ", entity, entity_val);
                if (entity == "aliasName" || entity == "newAliasName"){
                    promise_list.push(contractCall("getEncryptedAliasForKeccak",[entity_val]).catch(err=>{
                        console.log("alias enc error: ", err);
                    }));

                }else if ((entity == "tagName" || entity == "newTagName") && "aliasName" in entities){
                    console.log(["0x" + entities.aliasName, entity_val]);
                    promise_list.push(contractCall("getEncryptedTagForKeccak",["0x" + entities.aliasName, entity_val]).catch(err=>{
                        console.log("tag enc error: ", err);
                    }));
                }else{
                    promise_list.push(entity_val);
                }
            }else{
                promise_list.push(entity_val);
            }
        }
        Promise.all(promise_list).then(resList=>{
            console.log("RESENC: ", resList);
            for(var enc_idx = 0; enc_idx < resList.length; enc_idx+= 2){
                res_entities[resList[enc_idx]] = resList[enc_idx+1];
            }
            resolve(res_entities);
        }).catch(e=>{
            console.log("Perr:",e);
            reject(e);
        });
    });
    
}

function getMethodSignatures(){
    var abi = Injecter["TNS"]["abi"];
    for(var abi_elem of abi){
        if (abi_elem.type == "function"){
            var func_name = abi_elem.name;
            var inp_type_list = [];
            for (var input_idx = 0; input_idx < abi_elem.inputs.length; input_idx++){
                var input = abi_elem.inputs[input_idx];
                inp_type_list.push(input.type);
                if (paramInjected.has(input.name)){
                    if (func_name in paramIdx){
                        paramIdx[func_name][input.name] = input_idx;
                    }else{
                        paramIdx[func_name] = {[input.name]:input_idx};
                    }
                }
            }
            var method_str = `${func_name}(${inp_type_list.join(",")})`;
            var method_signature = tronWeb.sha3(method_str).substring(2,10);
            methodSigns[method_signature] = func_name;
        }
    }
};

function getEntityActionFromContractData(data){
    if ((data.length - 8) % 64 != 0){
        throw "Could not parse contract data"; 
    }
    var func_called_sign = data.substring(0,8);
    var func_called_name = methodSigns[func_called_sign];
    
    var params_str = data.substring(8);
    var param_list = [];
    var param_idx_dict = paramIdx[func_called_name];
    
    for(var start_p_idx = 0; start_p_idx < params_str.length; start_p_idx += 64){
        param_list.push(params_str.substring(start_p_idx,start_p_idx + 64));
    }

    var res_dict = {};
    for(var param in param_idx_dict){
        res_dict[param] = param_list[param_idx_dict[param]];
    }
    return [func_called_name, res_dict];
}

function fetchAccountTxs(ownerAddress, offset){
    return new Promise((resolve, reject)=>{
        tronWeb.trx.getTransactionsFromAddress(ownerAddress, 10000000000, offset).then(txList=>{
            console.log("TXLEN:", txList.length);
            console.log("OFFSET:", offset);
            var res_list = []
            var addr_hex = addressToHex(ownerAddress);

            for (var tx_idx = txList.length - 1; tx_idx >= 0; tx_idx--){
                var tx_dict = txList[tx_idx];
                if ("raw_data" in tx_dict && "contract" in tx_dict.raw_data){

                    for(var c_idx = 0; c_idx < tx_dict.raw_data.contract.length; c_idx++){
                        var contract_elem = tx_dict.raw_data.contract[c_idx]
                        if (contract_elem.type == "TriggerSmartContract" && "parameter" in contract_elem
                            && "value" in contract_elem.parameter){
                            var c_val_dict = contract_elem.parameter.value;
                            console.log("contract address: ", c_val_dict.contract_address);
                            if (c_val_dict.owner_address == addr_hex && 
                                c_val_dict.contract_address == TNSContractAddress){
                                var contract_result = "";

                                if ("ret" in tx_dict){
                                    if ("contractRet" in tx_dict.ret[c_idx]){
                                        contract_result = tx_dict.ret[c_idx].contractRet;
                                    }
                                }
                                var [func_name, entities] = getEntityActionFromContractData(c_val_dict.data);
                                res_list.push({
                                    txid: tx_dict.txID,
                                    funcName: func_name,
                                    entities: entities,
                                    timestamp: parseUnixTimestamp(tx_dict.raw_data.timestamp),
                                    result: contract_result
                                });
                                
                            }
                        }
                    }
                }
            }
            resolve([res_list, txList.length]);
        }).catch(e=>{
            reject(e);
        });
    }).then(txResList=>{
        console.log("Got txresList:", txResList);
        var promise_list = [];
        for (var tx of txResList[0]){
            console.log("EEEE", tx.entities);
            promise_list.push(
                fetchEncryptedDataforKeccak(tx.entities)
            );
        }
        console.log("Passed fetchencrypt");
        
        return Promise.all(promise_list).then(entityResList=>{
            console.log("ENTITYLIST", entityResList);
            for(var tx_idx = 0; tx_idx < txResList[0].length; tx_idx++){
                txResList[0][tx_idx].entities = entityResList[tx_idx];
                txResList[0][tx_idx].action = getActionStr(entityResList[tx_idx], txResList[0][tx_idx].funcName);
            }
            return txResList;
        }).catch(e=>{
            console.log("entity err",e);
        });
    }).then(resVal=>{
        return resVal;
    }).catch(e=>{
        throw e;
    });
}

exports.getOwnerActivity = function(req,res){
    var owner_address = req.params.owner;
    try{
        preCheck([owner_address]);
        if (tronWeb.isAddress(owner_address)){
            var offset = 0;
            if (owner_address in txCache){
                offset = txCache[owner_address].currTxIdx;
            }
            fetchAccountTxs(owner_address, offset).then(([resList,txListLen])=>{
                if (owner_address in txCache){
                    txCache[owner_address].currTxIdx = offset + txListLen;
                    resList.push.apply(resList,txCache[owner_address].data);
                    txCache[owner_address].data = resList;
                    res.json(createResJSON(txCache[owner_address].data));
                }else{
                    txCache[owner_address] = {
                        currTxIdx: txListLen,
                        data: resList
                    }
                    res.json(createResJSON(resList));
                }
                
            }).catch(e=>{
                throw e;
            })
        }else{
            throw ApiConfig.errors.INVALID_PARAM;
        }
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
    
}


getMethodSignatures();