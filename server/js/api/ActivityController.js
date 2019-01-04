var AppRoot = require("app-root-path");
var ApiConfig = require(AppRoot + "/server/config/api.json");
var tronWeb = require("./TronWebInst.js");
var mysql = require("./mysql.js");
var queries = require(AppRoot + "/server/config/queries.js");
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
var MAX_ACTIVITY_ENTRIES = 40;
var zeroBytes32 = "0x";
zeroBytes32 = zeroBytes32.padEnd(66,"0");

function addressToBase58(address){
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

    return new Promise((resolve, reject)=>{
        var res_entities = {};
        var promise_list = [];
        for (var entity in entities){
            promise_list.push(entity);
            var entity_val = "0x" + entities[entity];
            if (entity != "oldEncryptedAlias" && entity != "oldEncryptedTag"){

                if (entity == "aliasName" || entity == "newAliasName"){
                    promise_list.push(contractCall("getEncryptedAliasForKeccak",[entity_val]).catch(err=>{
                        console.log("alias enc error: ", err);
                    }));

                }else if ((entity == "tagName" || entity == "newTagName") && "aliasName" in entities){
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

function getEntityActionFromContractData(data, parseDataFlag){
    if ((data.length - 8) % 64 != 0){
        throw "Could not parse contract data"; 
    }
    var func_called_sign = data.substring(0,8);
    var func_called_name = methodSigns[func_called_sign];
    
    if (parseDataFlag == undefined || parseDataFlag == null) parseDataFlag = false;

    if (parseDataFlag){
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
    return [func_called_name, null];
}

function fetchAccountTxs(ownerAddress, offset){
    return new Promise((resolve, reject)=>{
        tronWeb.trx.getTransactionsFromAddress(ownerAddress, 10000000000, offset).then(txList=>{
            var res_list = []
            var addr_hex = addressToBase58(ownerAddress);

            for (var tx_idx = txList.length - 1; tx_idx >= 0; tx_idx--){
                var tx_dict = txList[tx_idx];
                if ("raw_data" in tx_dict && "contract" in tx_dict.raw_data){

                    for(var c_idx = 0; c_idx < tx_dict.raw_data.contract.length; c_idx++){
                        var contract_elem = tx_dict.raw_data.contract[c_idx]
                        if (contract_elem.type == "TriggerSmartContract" && "parameter" in contract_elem
                            && "value" in contract_elem.parameter){
                            var c_val_dict = contract_elem.parameter.value;

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

        var promise_list = [];
        for (var tx of txResList[0]){
            promise_list.push(
                fetchEncryptedDataforKeccak(tx.entities)
            );
        }

        return Promise.all(promise_list).then(entityResList=>{

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


/********************Socket Methods **********************/

var socketOwnerMap = {};
var ownerSocketMap = {};
var io = require('socket.io')(8888);
var prevBlockNum = 0;

function monitorBlock(){
    var getOwners = function(contractList){
        var res_owners = [];
        for(var contract of contractList){
            if (contract.type == "TriggerSmartContract"){
                if ("parameter" in contract && "value" in contract.parameter){
                    var contract_owner = contract.parameter.value.owner_address;
                    var base58_addr = addressToBase58(contract_owner);
                    if (base58_addr in ownerSocketMap){
                        res_owners.push(base58_addr);
                    }
                }
            }
        }
        return res_owners;
    }

    tronWeb.trx.getCurrentBlock().then(blockRes=>{
        try{
            var curr_blk_num = blockRes.block_header.raw_data.number;
            var blk_diff = curr_blk_num - prevBlockNum;
            if (blk_diff > 0 && blk_diff != 0){
                if ("transactions" in blockRes){
                    var tx_list = blockRes.transactions;
                    for (var tx of tx_list){
                        if ("raw_data" in tx && "contract" in tx.raw_data){
                            var tx_owners = getOwners(tx.raw_data.contract);
                            for (var owner of tx_owners){
                                console.log('owernset:', ownerSocketMap[owner]);
                                for (var socket_id of ownerSocketMap[owner]){
                                    io.to(socket_id).emit("gotMail", "true");
                                    console.log("got mail emit sent to ", owner, socket_id);
                                }
                            }
                        }
                    }
                }
                prevBlockNum = curr_blk_num;
            }
        }catch(e){
            console.log("Error fetching block:", e);
        }
    })
}

function getTxsHelper(aliasOwner, timePosted){
    return new Promise((resolve,reject)=>{
        var param_dict = {
            aliasOwner: aliasOwner,
            timePosted: timePosted
        }
        var query_str = queries.fetch.format(param_dict);
        console.log(query_str);
        mysql.query(query_str, function (err, result) {
            if (err) reject(err);
            else{
                resolve(result);
            }
        });
    });
}

function parseTxInfo(queryTx, txResult){
    var res_dict = {};
    if (txResult && "raw_data" in txResult && "contract" in txResult.raw_data){
        for(var c_idx = 0; c_idx < txResult.raw_data.contract.length; c_idx++){
            var contract_elem = txResult.raw_data.contract[c_idx]
            if (contract_elem.type == "TriggerSmartContract" && "parameter" in contract_elem
                && "value" in contract_elem.parameter){
                var c_val_dict = contract_elem.parameter.value;

                if (c_val_dict.owner_address == tronWeb.address.toHex(queryTx.aliasOwner) && 
                    c_val_dict.contract_address == TNSContractAddress){
                    var contract_result = "";

                    if ("ret" in txResult){
                        if ("contractRet" in txResult.ret[c_idx]){
                            contract_result = txResult.ret[c_idx].contractRet;
                        }
                    }
                    var [func_name, _] = getEntityActionFromContractData(c_val_dict.data);
                    res_dict = {
                        txid: txResult.txID,
                        funcName: func_name,
                        action: ApiConfig.contractFuncAction[func_name],
                        entities: JSON.parse(queryTx.entities),
                        timestamp: parseUnixTimestamp(txResult.raw_data.timestamp),
                        result: contract_result
                    };
                }
            }
        }
    }
    return res_dict;
}
function getTxInfo(txList){
    return new Promise((resolve, reject)=>{
        var promise_list = [];
        for (var tx of txList){
            var txid = tx.txid;
            promise_list.push(tronWeb.trx.getTransaction(txid).catch(e=>{
                console.log("getTx Error:", e, txid);
            }));
        }

        Promise.all(promise_list).then(resPList=>{
            var res_txs = [];
            for(var p_idx = 0; p_idx < resPList.length; p_idx++){
                var parsed_info = parseTxInfo(txList[p_idx], resPList[p_idx]);
                if (Object.keys(parsed_info).length > 0){
                    res_txs.push(parsed_info);
                }
            }
            resolve(res_txs);
        }).catch(e=>{
            console.log("Perr:",e);
        });
    })
}

exports.storeTx = function(req,res){
    try{
        console.log(req.body);
        var txid = req.body.txid;
        var alias_owner = req.body.aliasOwner;
        var entities = req.body.entities;

        preCheck([txid,alias_owner,entities]);

        if (!tronWeb.isAddress(alias_owner) || txid.length != 64){
            throw ApiConfig.errors.INVALID_PARAM;
        }else{
            var param_dict = {
                aliasOwner: alias_owner,
                entities: entities,
                txid: txid
            }
            var query_str = queries.insert.format(param_dict);
            console.log(query_str);
            mysql.query(query_str, function (err, result) {
                if (err) throw err;
                res.json(createResJSON("success"));
            });
        }
    }catch(e){
        console.log(e);
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getTxs = function(req,res){
    try{
        var alias_owner = req.params.aliasOwner;

        preCheck([alias_owner]);

        if (!tronWeb.isAddress(alias_owner)){
            throw ApiConfig.errors.INVALID_PARAM;
        }else{
            getTxsHelper(alias_owner, "").then(qResult=>{
                var res_list = [];
                for (var row of qResult){
                    res_list.push({
                        txid: row.txid,
                        entities: JSON.parse(row.entities),
                        timePosted: row.timePosted
                    });
                }
                res.json(createResJSON(res_list));
            }).catch(err=>{
                throw err;
            })
        }
    }catch(e){
        console.log(e);
        res.status(400).json(createErrorJSON(e));
    }
}

exports.getOwnerTxActivity = function(req,res){
    var alias_owner = req.params.owner;
    try{
        preCheck([alias_owner]);
        if (tronWeb.isAddress(alias_owner)){
            
            getTxsHelper(alias_owner, "").then(result=>{
                getTxInfo(result).then(parsedTxs=>{
                    res.json(createResJSON(parsedTxs));
                }).catch(err=>{
                    console.log(err);
                    res.status(400).json(createErrorJSON(err));
                })
            }).catch(err=>{
                res.status(400).json(createErrorJSON(err));
            });
        }else{
            throw ApiConfig.errors.INVALID_PARAM;
        }
    }catch(e){
        res.status(400).json(createErrorJSON(e));
    }
    
}

io.on('connection', function (socket) {
    console.log("server connect:", socket.id);
    socket.on("watchMe", function (owner) {
        socketOwnerMap[socket.id] = owner;
        if (owner in ownerSocketMap){
            ownerSocketMap[owner].add(socket.id);
        }else{
            ownerSocketMap[owner] = new Set([socket.id]);
        }
        console.log("watching owner", owner, ownerSocketMap);
    });

    socket.on('disconnect', function () {
        var owner = socketOwnerMap[socket.id];
        if (owner){
            ownerSocketMap[owner].delete(socket.id);
            if (ownerSocketMap[owner].size < 1){
                delete ownerSocketMap[owner];
            }
        }
        delete socketOwnerMap[socket.id];
        console.log("socket disconnected");
        console.log(ownerSocketMap);
    });
});

setInterval(monitorBlock, 3000);