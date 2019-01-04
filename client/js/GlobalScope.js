import Injecter from "../../injecter.json";
import axios from "axios";

window.ENC_PREFIX_HEX = "5454545454"; //TTTTT
 
const TNSContractAddress = Injecter["TNS"]["address"];
console.log("contract address", TNSContractAddress);

window.zeroAddress = "410000000000000000000000000000000000000000";

window.contractSend = function(contractFunc, args, sendParams){
    return new Promise((resolve,reject)=>{
        try{
            let params = {
                feeLimit: 100000,
                shouldPollResponse: false
            }
            if (sendParams != null || sendParams != undefined){
                params = Object.assign(params, sendParams);
            }
            window.tronWeb.contract().at(TNSContractAddress).then(contract=>{
                contract[contractFunc](...args).send(params).then(result=>{
                    resolve(result);
                }).catch(e=>{reject(e);});
            }).catch(e=>{reject(e);});            
        }catch(e){
            reject(e);
        }
    });
}
window.storeTx = function(params){
    return new Promise((resolve,reject)=>{
        if (params.txid.trim() == "") reject("Couldn't find transaction id of created transaction");
        axios.post(`/activityApi/txStore`,{
            txid: params.txid,
            aliasOwner: params.owner,
            entities: JSON.stringify(params.entities)
        }).then(res=>{
            resolve(res);
        }).catch(e=>{
            reject(e);
        })
    });
}
window.hexToBytes32 = function(hex){
    return "0x" + hex.padStart(64,"0");
}
window.isZeroAddress = function(address){
    if (address == "410000000000000000000000000000000000000000") return true;
    return false;
}
window.base58 = function(address){
    if (address.startsWith("0x")){
        address = address.replace(/^0x/gi,"41");
    }
    return tronWeb.address.fromHex(address);
}
window.encryptData = function(data, addPrefix){
    let encrypted = blowfish.encrypt(data, localStorage.getItem("tnsx"), {cipherMode: 0, outputType: 1});
    if (addPrefix == undefined || addPrefix == true || addPrefix == null){
        return hexToBytes32(ENC_PREFIX_HEX + encrypted);
    }else{
        return encrypted;
    }
    
}
window.decryptData = function(data){
    if (data.startsWith("0x")){
        let regex = new RegExp(`^0x0*${ENC_PREFIX_HEX}`);
        data = data.replace(regex,"");
    }
    
    return blowfish.decrypt(data, localStorage.getItem("tnsx"), {cipherMode: 0, outputType: 1});
}
window.decodeEncryptFormat = function(data){
    let regex = new RegExp(`^0x0*${ENC_PREFIX_HEX}`);
    data = data.replace(regex,"");
    
    let prefix_reg = new RegExp(`^0x`);
    data = data.replace(prefix_reg, "");
    return data;
}
window.resizePopup = function(){
    $('.ui.popup').css('max-height', "100vh");
};

$(window).resize(function(e){
    window.resizePopup();
});

window.tableBorderRefresh = function(tableElem, rowListLen){
    let first_th = tableElem + " thead tr:first-child>th:first-child";
    let last_th = tableElem + " thead tr:first-child>th:last-child";
    if (rowListLen == 0){
        $(first_th).addClass("border_radius_bottomleft_1em");
        $(last_th).addClass("border_radius_bottomright_1em");
    }else{
        $(first_th).addClass("border_radius_bottomleft_1em");
        $(last_th).addClass("border_radius_bottomright_1em");
    }
}   