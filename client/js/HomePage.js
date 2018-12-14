import React from "react";

export default class HomePage extends React.Component{
	constructor(props){
		super(props);
	}

	render(){
		return(
			<div>
				<p className="title"> Hi</p>
			</div>
		);
	}
}

HomePage.defaultProps = {

}