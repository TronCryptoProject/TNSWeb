import React from "react";

export default class LoginPage extends React.Component{
    constructor(props){
        super(props);
        this.state = {};
        this.eventLoginClick = this.eventLoginClick.bind(this);
    }

    componentDidMount(){
        let navheight = $("#navbar").outerHeight(true);
        $("#login_page_main_div").css("height", `calc(100% - ${navheight}px)`);
    }

    eventLoginClick(e){
        let confirm_val = $("#login_confirm_pass_input").val().trim();
        let initial_val = $("#login_pass_input").val().trim();
        let normal_state_dict = {
            normal: {
                text: "Login",
                icon: "sign in"
            }
        };
        let button_conf_dict = {};
        let func_callback = (function(){});

        if (confirm_val != "" && initial_val != ""){
            if (initial_val == confirm_val){
                button_conf_dict = {
                    type: "success",
                    success: {
                        text: "Success"
                    }
                };
                func_callback = ()=>{
                    localStorage.setItem("tnsx", confirm_val);
                    this.props.onSuccessCallback();
                }
            }else{
                button_conf_dict = {
                    type: "error",
                    error: {
                        text: "Passwords don't match"
                    }
                };
            }
        }else{
            button_conf_dict = {
                type: "error",
                error: {
                    text: "Password is empty"
                }
            };
        }
        Object.assign(button_conf_dict, normal_state_dict);
        $(e.target).showButtonConf(button_conf_dict, func_callback);
    }

    render(){
        return(
            <div className="ui dead_center text container" id="login_page_main_div">
                <div className="ui fluid raised card">
                    <div className="ui one column centered padded grid">
                        <h2 className="ui header">
                            Enter/Create Your Password
                        </h2>
                        <div>
                            Your password will be used to encrypt/decrypt aliases and is never stored 
                            in the contract. If you forget or enter a wrong password, you'll still see
                            data but will not be able to read it.
                        </div>

                        <div className="no_padding fullwidth row_spaced_div">
                            <div className="row">
                                <div className="ui tiny statistic fullwidth">
                                    <div className="value">
                                        <div className="ui transparent small input">
                                            <input type="password" placeholder="Password" id="login_pass_input"
                                                className="text_center" autoComplete="off"
                                                spellCheck="false"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="ui tiny statistic fullwidth">
                                    <div className="value">
                                        <div className="ui transparent small input">
                                            <input type="password" placeholder="Confirm Password" id="login_confirm_pass_input"
                                                className="text_center" autoComplete="off"
                                                spellCheck="false"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                

                        <div className="row">
                            <button className="ui right labeled icon green button"
                                onClick={e=>{this.eventLoginClick(e)}}>
                                <i className="sign in icon"/>
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

LoginPage.defaultProps = {
    onSuccessCallback: (function(){})
}