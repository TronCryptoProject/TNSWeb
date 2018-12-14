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
import HomePage from "./HomePage.js"

class Index extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			tronWebState: {
				installed: false,
				loggedIn: false
			}
		};
		this.tronLinkInterval = null;
		this.tronLinkCheckerRunning = true;
	}

	componentDidMount(){
		let maxtime = 10000;
		let currtime = 0;
		let timeinterval = 500;
		this.tronLinkInterval = setInterval(()=>{
			currtime += timeinterval;
			let is_installed = !!window.tronWeb;

			if (currtime >= maxtime || is_installed){
				const tronWebState = {
					installed: is_installed,
					loggedIn: window.tronWeb && window.tronWeb.ready
				};

				if ((tronWebState.installed && tronWebState.loggedIn) ||
					currtime >= maxtime){
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
					},2000);
				}else{
					setState();
				}
				
			}
		}, timeinterval);
	}

	render(){
		let main_comp;
		
		if (this.tronLinkCheckerRunning){
			let checker_title = "";
			if (!this.state.tronWebState.installed){
				checker_title = "Checking if TronLink is installed";
			}else if (!this.state.tronWebState.loggedIn){
				checker_title = "Checking if you're logged into TronLink";
			}
			main_comp = <TronLinkChecker title={checker_title}/>

		}else{
			if (!this.state.tronWebState.installed){
				main_comp = <TronLinkDownload/>;	
			}else{
				main_comp = <HomePage/>;
			}
		}
		

		return (
			<div className="fullscreen">{main_comp}</div>
		);

	}

}

ReactDOM.render(<Index/>, $("#htmlroot")[0]);
