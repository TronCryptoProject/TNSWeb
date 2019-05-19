import React from "react";

export default class HomePage extends React.Component{
	constructor(props){
		super(props);
		this.state = {};
	}

	handleMenuClick(e){
		let id = e.target.id;
		$("#" + id).addClass("active");
		if (this.state.currActiveItem != ""){
			$("#" + this.state.currActiveItem).removeClass("active");
		}
		this.setState({currActiveItem: id});
	}

	
	render(){
		return(
			<div className="ui center aligned container" id="hp_logo_container">
				<object type="image/svg+xml" data="client/images/tron_logo_shadow_dark_loop.svg"
					className="vertical_transform"></object>
				<div className="vertical_transform">
					<div className="ui hp_title">
						Tron Name Service
					</div>
					<div className="ui hp_subtitle">
						Transforming Blockchain with Human Readable Addresses
					</div>
				</div>
			</div>
		);
	}
}

HomePage.defaultProps = {

}