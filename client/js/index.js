import React from "react";
import ReactDOM from "react-dom";
import TronWeb from "tronweb";

class IndexPage extends React.Component{
	constructor(props){
		super(props);
	}
	componentDidMount(){
		const tronWeb = new TronWeb(
		   	"http://127.0.0.1:8090",
		    "http://127.0.0.1:8091",
		    "http://127.0.0.1:8092",
		    "1992f2bc8b15a508e09d6e5f87fb63543b64f105f86001bfcc7a6cb72764bb8f"
		);
		tronWeb.isConnected().then(res=>{
			console.log("RES:", res);
			var key = "testKey";
		    var keccak_key = tronWeb.sha3(key);
		    tronWeb.contract().at("41776fd337d5358d04efe2e8f1625f098af239d207")
		    .then(contract =>{
		        console.log(contract);
		        //console.log(contract.isKeyAvailable(keccak_key).call());
		        contract.isKeyAvailable(keccak_key).call().then(res=>{
		            console.log("RES:",res);
		        }).catch(error=>{
		            console.log("E: ", error);
		        });
		    })
		    .catch(error=>{
		        console.log("contract error: ", error);
		    })

		}).catch(error=>{
			console.log("E:",error);
		});

	}
	render(){
		return <div></div>;
	}

}

ReactDOM.render(<IndexPage/>, $("#root_renderer")[0]);