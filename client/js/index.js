$.fn.extend({
	animateCss: function(animationName, callback) {
		var animationEnd = (function(el) {
		var animations = {
			animation: 'animationend',
			OAnimation: 'oAnimationEnd',
			MozAnimation: 'mozAnimationEnd',
			WebkitAnimation: 'webkitAnimationEnd',
		};

		for (var t in animations) {
			if (el.style[t] !== undefined) {
				return animations[t];
			}
		}
		})(document.createElement('div'));

		this.addClass('animated ' + animationName).one(animationEnd, function() {
			$(this).removeClass('animated ' + animationName);
			if (typeof callback === 'function') callback();
		});

		return this;
	},
	showButtonConf: function(args, callback){
		/*
			{
				type: "error",
				duration: 1000,
				error: {
					text: ""
				},
				success:{
					text: ""
				}
				normal: {
					text: "",
					icon: ""
				}
				
			}
		*/
		if (this.is("button")){
			var duration = "duration" in args ? args.duration: 1000;
			var label_removed = false;
			if ((args.type == "error" || args.type == "success")){
				this.css("transition", "all 0.5s");
				if (this.hasClass("right") && this.hasClass("labeled")){
					label_removed = true;
					this.removeClass("right labeled");
				}
			}
			
			if (args.type == "error"){
				this.addClass("red");
				this.text(args.error.text);
				setTimeout(()=>{
					this.removeClass("red");
					this.text(args.normal.text);
					
					if (label_removed) this.addClass("right labeled");
					
					if (this.hasClass("icon")){
						var icon = args.normal.icon + " icon";
						this.prepend(`<i class="${icon}"/>`);
					}
					if (typeof callback === 'function') callback();
				}, duration);
				
			}else if(args.type == "success"){
				let green_color_added = false;
				if (!this.hasClass("green")){
					green_color_added = true;
					this.addClass("green");
				}
				
				this.text(args.success.text);
				setTimeout(()=>{
					if (green_color_added) this.removeClass("green");
					
					this.text(args.normal.text);
					
					if (label_removed) this.addClass("right labeled");

					if (this.hasClass("icon")){
						var icon = args.normal.icon + " icon";
						this.prepend(`<i class="${icon}"/>`);
					}
					if (typeof callback === 'function') callback();
				}, duration);
			}
		}
		
	}
});

import React from "react";
import ReactDOM from "react-dom";
import TronLinkDownload from "./TronLinkDownload.js";
import TronLinkChecker from "./TronLinkChecker.js";
import HomePage from "./HomePage.js";
import LiveDemo from "./LiveDemo.js";
import HomePageFeatures from "./HomePageFeatures.js";
import LoginPage from "./LoginPage.js";
import UserHome from "./UserHome.js";
import APIPage from "./APIPage.js";

class Index extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			tronWebState: {
				installed: false,
				loggedIn: false
			},
			currPage: "home"
		};
		this.tronLinkInterval = null;
		this.tronLinkCheckerRunning = true;
		this.getMainComp = this.getMainComp.bind(this);
		this.handleMenuClick = this.handleMenuClick.bind(this);
		this.getNavBar = this.getNavBar.bind(this);
		this.getBackground = this.getBackground.bind(this);
		this.eventNavDropUserHomeClick = this.eventNavDropUserHomeClick.bind(this);
		this.eventNavDropLogoutClick = this.eventNavDropLogoutClick.bind(this);
		this.switchToUserHome = this.switchToUserHome.bind(this);
	}

	componentDidMount(){
		let maxtime = 5000;
		let currtime = 0;
		let timeinterval = 200;
		let extratime = 1000;
		this.tronLinkInterval = setInterval(()=>{
			currtime += timeinterval;
			let is_installed = !!window.tronWeb;

			if (currtime >= maxtime || is_installed){
				const tronWebState = {
					installed: is_installed,
					loggedIn: window.tronWeb && window.tronWeb.ready
				};

				if ((tronWebState.installed && tronWebState.loggedIn) ||
					(currtime >= maxtime && !tronWebState.installed)){
					clearInterval(this.tronLinkInterval);
					this.tronLinkCheckerRunning = false;
				}

				let setState = ()=>{
					this.setState({tronWebState: tronWebState}, ()=>{
						console.log("tr", this.state.tronWebState.installed);
					});
				}
				if (tronWebState.loggedIn){
					setTimeout(()=>{
						setState();
					},extratime);
				}else{
					setState();
				}
				
			}
		}, timeinterval);
	}

	componentDidUpdate(){
		$(".ui.dropdown").dropdown();
	}

	handleMenuClick(e){
		let id = e.target.id;
		$("#" + id).addClass("active");
		if (this.state.currPage != ""){
			$("#" + this.state.currPage).removeClass("active");
		}
		this.setState({currPage: id}, ()=>{
			if (this.state.currPage == "api_item"){
				$("#navbar").addClass("no_margined_b");
			}else{
				if ($("#navbar").hasClass("no_margined_b")){
					$("#navbar").removeClass("no_margined_b");
				}
			}
		});
	}

	switchToUserHome(){
		this.setState({currPage: "userhome_item"});
	}

	getMainComp(){
		let main_comp;

		if (this.tronLinkCheckerRunning){
			let checker_title = "";
			if (!this.state.tronWebState.installed){
				checker_title = "Checking if TronLink is installed";
			}else if (!this.state.tronWebState.loggedIn){
				checker_title = "Checking if you're logged into TronLink. Please login if you haven't";
			}
			main_comp = <TronLinkChecker title={checker_title}/>
		}else{
			if (!this.state.tronWebState.installed){
				main_comp = <TronLinkDownload/>;	
			}else{
				switch(this.state.currPage){
					case "home": 
						main_comp = <HomePage/>;
						break;
					case "live_demo_item":
						main_comp = <LiveDemo/>;
						break;
					case "api_item":
						main_comp = <APIPage/>;
						break;
					case "login_item":
						main_comp = <LoginPage onSuccessCallback={this.switchToUserHome}/>;
						break;
					case "userhome_item":
						main_comp = <UserHome/>;
						break;
					case "logout_item":
						main_comp = <HomePage/>;
						break;
					default:
						break;
				}
			}
		}
		return main_comp;
	}

	eventNavDropUserHomeClick(e){
		this.setState({currPage: "userhome_item"});
	}

	eventNavDropLogoutClick(e){
		localStorage.removeItem("tnsx");
		if (this.state.currPage == "userhome_item"){
			this.setState({currPage: "home"});
		}
		this.forceUpdate();
	}

	getNavBar(compName){
		if (compName != "TronLinkChecker" && compName != "TronLinkDownload"){
			let getUserStateDiv = ()=>{
				let tnsx = localStorage.getItem("tnsx");
				if (tnsx != undefined && tnsx != ""){
					return(
						<div className="ui pointing dropdown item" id="nav_dropdown">
							User Portal
							<i className="dropdown icon"></i>
							<div className="menu">
								<div className="dead_center item" onClick={e=>{this.eventNavDropUserHomeClick(e)}}
									id="userhome_item">
									Aliases
								</div>
								<div className="dead_center item" onClick={e=>{this.eventNavDropLogoutClick(e)}}
									id="logout_item">
									Logout
								</div>
							</div>
						</div>
					);
				}else{
					return(
						<a className="ui item" onClick={(e)=>{this.handleMenuClick(e)}} id="login_item">
							Login
						</a>
					);
				}
			}

			return (
				<div className="ui secondary pointing borderless menu" id="navbar">
					<a className="ui item no_padding" onClick={(e)=>{this.handleMenuClick(e)}}
						id="home">
						<img src="../images/tron_logo_shadow_white.svg"/>
						TNS
					</a>
					<div className="right menu">
						<a className="ui item" onClick={(e)=>{this.handleMenuClick(e)}}
							id="live_demo_item">
							Live Demo
						</a>
						<a className="ui item" onClick={(e)=>{this.handleMenuClick(e)}} id="api_item">
							API
						</a>
						{getUserStateDiv()}
					</div>
				</div>
			);
		}
	}

	getBackground(compName){
		let background = "";
		switch(compName){
			case "TronLinkDownload":
				background = "tronlink_background";
				break;
			case "TronLinkChecker":
				background = "tronlinkchecker_background";
				break;
			case "HomePage":
				background = "hp_background";
				break;
			case "LiveDemo":
				background = "livedemo_background";
				break;
			case "LoginPage":
				background = "hp_background";
				break;
			case "UserHome":
				background = "userhome_background";
				break;
			case "APIPage":
				background = "hp_background";
				break;
			default:
				break;
		}
		return background;
	}

	render(){
		let component = this.getMainComp();
		let curr_background = this.getBackground(component.type.name);
		
		let getRemDivs = ()=>{
			let divs;
			switch(component.type.name){
				case "HomePage":
					divs = <HomePageFeatures/>;
					break;
				default:
					break;
			}
			return divs;
		}

		return (
			<div>
				<div className={`fullscreen ${curr_background}`} id="main_background_div">
					{this.getNavBar(component.type.name)}
					{component}
				</div>
				{getRemDivs()}
			</div>
		);

	}

}

ReactDOM.render(<Index/>, $("#htmlroot")[0]);
