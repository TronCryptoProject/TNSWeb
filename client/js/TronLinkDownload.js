

import React from "react";

export default class TronLinkDownload extends React.Component{
	constructor(props){
		super(props);
	}

	render(){
		return(
			<div className="ui center aligned container vertical_center">
				<p className="tronlink_title no_margin">No TronLink</p>
				<p className="tronlink_subtitle">
					It seems TronLink is not installed in your browser. TronLink makes connecting with DApps
					super fast and easy!
				</p>
					
				<a href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec"
					className="ui medium rounded image tronlink_download">
					<div className="ui red ribbon tiny label">
						Download Here
					</div>
					<img src="../images/tron_link.png"/>
				</a>
			</div>
		);
	}
}

