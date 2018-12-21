import React from "react";

export default class TronLinkChecker extends React.Component{
	constructor(props){
		super(props);
	}

	componentDidMount(){
		$("#tronlinkchecker_svg").animateCss('zoomIn delay-1s');
		$("#tronlinkchecker_title").animateCss('zoomIn delay-1s');
	}
	render(){
		return(
			<div className="ui center aligned container vertical_center">
				<div className="ui container text_center tronlinkchecker_title" id="tronlinkchecker_title">
					{this.props.title}
				</div>
				<object type="image/svg+xml" data="../images/tron_loader.svg" id="tronlinkchecker_svg">
				</object>
			</div>
		);
	}
}

TronLinkChecker.defaultProps = {
	title: ""
}