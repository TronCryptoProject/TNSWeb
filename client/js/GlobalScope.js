import Injecter from "../../injecter.json";

const TNSContractAddress = Injecter["TNS"]["address"];
console.log("contract address", TNSContractAddress);

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
window.encryptData = function(data){
    return blowfish.encrypt(data, localStorage.getItem("tnsx"), {cipherMode: 0, outputType: 1});
}
window.decryptData = function(data){
    if (data.startsWith("0x")){
        data = data.replace(/^0x0*/gi,"");
    }
    return blowfish.decrypt(data, localStorage.getItem("tnsx"), {cipherMode: 0, outputType: 1});
}

window.resizePopup = function(){
    $('.ui.popup').css('max-height', "100vh");
};

$(window).resize(function(e){
    window.resizePopup();
});