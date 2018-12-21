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
});

import React from "react";
import ReactDOM from "react-dom";
import TronLinkDownload from "./TronLinkDownload.js";
import TronLinkChecker from "./TronLinkChecker.js";
import HomePage from "./HomePage.js";
import LiveDemo from "./LiveDemo.js";
import HomePageFeatures from "./HomePageFeatures.js";

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

	handleMenuClick(e){
		let id = e.target.id;
		$("#" + id).addClass("active");
		if (this.state.currPage != ""){
			$("#" + this.state.currPage).removeClass("active");
		}
		this.setState({currPage: id});
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
						break;
					case "login_item":
						break;
					default:
						break;
				}
			}
		}
		return main_comp;
	}

	getNavBar(compName){
		if (compName != "TronLinkChecker" && compName != "TronLinkDownload"){
			return (
				<div className="ui secondary pointing borderless menu">
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
						<a className="ui item" onClick={(e)=>{this.handleMenuClick(e)}} id="login_item">
							Login
						</a>
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
				<div className={`fullscreen ${curr_background}`}>
					{this.getNavBar(component.type.name)}
					{component}
				</div>
				{getRemDivs()}
			</div>
		);

	}

}

ReactDOM.render(<Index/>, $("#htmlroot")[0]);
