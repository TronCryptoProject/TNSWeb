import React from "react";
import get from "axios";
import to from 'await-to-js';
import CreateAlias from "./CreateAlias.js";

export default class UserHome extends React.Component{
	constructor(props){
        super(props);
        this.state = {
            userAccount: window.tronWeb.defaultAddress.base58,
            data: {}
        };
        this.fetchData = this.fetchData.bind(this);
        this.createAliasInfoCards = this.createAliasInfoCards.bind(this);
        this.eventCreateAlias = this.eventCreateAlias.bind(this);
        this.hideCreateAliasCallback = this.hideCreateAliasCallback.bind(this);
    }

    componentDidMount(){
        this.fetchData(this.props);
    }
    
    async fetchData(props){
        let [err, response] = await to(get(`api/allAliasInfo/${this.state.userAccount}`));
        if (!err){
            let data = response.data;
            console.log(data.result);
            this.setState({data: data.result});
        }else{
            console.log("error: ", err);
        }
    }

    eventCreateAlias(){
        $("#create_alias_modal").modal({
            blurring: true,
            allowMultiple: true,
            closable: false,
            transition: "slide up",
            duration: 100,
            onShow: () =>{
                $("#create_alias_modal").parent().addClass("fullscreen_modal_background");
                $("#create_alias_modal").parent().addClass("overflow_hidden");
            },
            onHidden:()=>{
                $("#create_alias_modal").parent().removeClass("fullscreen_modal_background");
                $("#create_alias_modal").parent().removeClass("overflow_hidden");
            }
        })
        .modal("show");
    }

    hideCreateAliasCallback(){
        $("#create_alias_modal").modal("hide");
    }

    createAliasInfoCards(){
        return(
            <div></div>
        );
    }

    render(){
        return(
            <div>
                <div className="ui text container">
                    <div className="ui inverted orange small statistic">
                        <div className="value">
                            {this.state.userAccount}
                        </div>
                        <div className="label">
                            Current User Account
                        </div>
                    </div>
                </div>
                <div className="ui blue buttons">
                    <button className="ui large button" onClick={this.eventCreateAlias}>Create Alias</button>
                </div>
                <div className="ui center aligned large header">
                    {Object.keys(this.state.data).length} aliases found for current account
                </div>
                {this.createAliasInfoCards()}
                <CreateAlias hideModal={this.hideCreateAliasCallback}/>
            </div>            
        );
    }
}

UserHome.defaultProps = {

}