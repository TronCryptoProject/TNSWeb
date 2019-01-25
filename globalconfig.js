module.exports = {
	"network": {
        "dev":{ 
            "fullNode": "http://127.0.0.1:8090",
            "solidityNode": "http://127.0.0.1:8091",
            "eventServer": "http://127.0.0.1:8092"
        },
        "shasta":{
            "fullNode": "https://api.shasta.trongrid.io",
            "solidityNode": "https://api.shasta.trongrid.io",
            "eventServer": "https://api.shasta.trongrid.io"
        },
        "mainnet":{
            "fullNode": "http://47.90.215.84:8090",
            "solidityNode": "http://47.75.10.71:8091",
            "eventServer": "https://api.trongrid.io"
        }
    },
	"privateKey": {
		"dev": process.env.PRIV_KEY_DEV,
		"shasta": process.env.PRIV_KEY_SHASTA,
		"mainnet": process.env.PRIV_KEY_MAINNET
	}
}
