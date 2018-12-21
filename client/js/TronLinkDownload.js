

import React from "react";
import TronLinkImg from "../images/tron_link.png";

export default class TronLinkDownload extends React.Component{
	constructor(props){
		super(props);
	}

	render(){
		return(
			<div className="ui center aligned container vertical_center">
				<p className="tronlink_title m-0">No TronLink</p>
				<p className="tronlink_subtitle">
					It seems TronLink is not installed in your browser. TronLink makes connecting with DApps
					super fast and easy!
				</p>
					
				<a href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec"
					className="ui medium rounded image my-5">
					<div className="ui red ribbon tiny label">
						Download Here
					</div>
					<img src={TronLinkImg}/>
				</a>
			</div>
		);
	}
}

