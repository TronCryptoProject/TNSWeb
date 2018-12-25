import React from "react";
import GenerateAddressSegment from "./GenerateAddressSegment.js";

export default class CreateAlias extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            aliasSize: "0",
            tagSize: "0"
        };
        this.eventCloseCreateAliasModal = this.eventCloseCreateAliasModal.bind(this);
        this.eventAliasPrivacyClick = this.eventAliasPrivacyClick.bind(this);
        this.eventAliasOnChange = this.eventAliasOnChange.bind(this);
        this.eventTagOnChange = this.eventTagOnChange.bind(this);
        this.createStaticAddressSegment = this.createStaticAddressSegment.bind(this);
        this.eventStaticAddressOnChange = this.eventStaticAddressOnChange.bind(this);
    }

    componentDidMount(){
        $(".tabular.menu .item").tab();
        this.setState({
            aliasSize: $("#create_alias_input").attr("placeholder").length,
            tagSize: $("#create_tag_input").attr("placeholder").length
        });
    }

    eventCloseCreateAliasModal(){
        this.props.hideModal();
    }

    eventAliasPrivacyClick(e, state){
        if (state == "public"){
            $("#alias_secret_button").removeClass("orange");
            $("#alias_public_button").addClass("orange");
        }else{
            $("#alias_public_button").removeClass("orange");
            $("#alias_secret_button").addClass("orange");
        }
    }

    eventAliasOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9_]/g, "");
        $(e.target).val(val);
        let input_len = Math.ceil(val.length - (val.length * 0.10));
        let max_len = Math.max(input_len , $(e.target).attr("placeholder").length);
        this.setState({aliasSize: max_len});
    }

    eventTagOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9_]/g, "")
        $(e.target).val(val);
        let input_len = Math.ceil(val.length - (val.length * 0.15));
        let max_len = Math.max(input_len, $(e.target).attr("placeholder").length);
        this.setState({tagSize: max_len});
    }

    eventStaticAddressOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9]/g, "")
        $(e.target).val(val);
    }

    createStaticAddressSegment(){
        return(
            <div>
                <div className="text_center lineheight  description">
                    This is the public address you want to associate with your alias. When a sender
                    is sending you crypto using your alias, it will always resolve to this address.
                </div>
                <div className="text center aligned container">
                    <div className="ui tiny fullwidth statistic" id="static_address_div">
                        <div className="value">
                            <div className="ui transparent large input">
                                <input type="text" placeholder="Enter Here"
                                    className="text_center" autoComplete="off" spellCheck="false"
                                    onChange={e=>{this.eventStaticAddressOnChange(e)}} 
                                    id="static_address_input"
                                    maxLength="34"/>
                            </div>
                        </div>
                        <div className="label initialcase">
                            Tron Public Address
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render(){
        return(
            <div className="ui modal create_alias_modal" id="create_alias_modal">
				<div className="ui blurring segment modal_layout_segment">
					<div className="ui centered three column grid row margined_b">
                        <div className="column"></div>
                        <div className="column padding_y">
                            <div className="ui huge blue center aligned header">
                                Create New Alias
                            </div>
                        </div>
                        <div className="column">
                            <button className="ui right floated icon circular button" onClick={this.eventCloseCreateAliasModal}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                      
					<div className="fluid dead_center container">
                        <div className="ui tiny statistic" id="create_alias_div">
                            <div className="value">
                                <div className="ui transparent large input">
                                    <input type="text" placeholder="Alias"
                                        className="text_center" autoComplete="off" spellCheck="false"
                                        onChange={e=>{this.eventAliasOnChange(e)}} 
                                        size={this.state.aliasSize}
                                        id="create_alias_input"
                                        maxLength="20"/>
                                </div>
                                <span className="bracket">{"{"}</span>
                                <div className="ui transparent large input">
                                    <input type="text" placeholder="Tag"
                                        className="text_center" autoComplete="off" spellCheck="false"
                                        onChange={e=>{this.eventTagOnChange(e)}}
                                        size={this.state.tagSize}
                                        id="create_tag_input"
                                        maxLength="20"/>
                                </div>
                                <span className="bracket">{"}"}</span>
                            </div>
                            <div className="label initialcase">
                                Please enter your Alias/Tag
                            </div>
                            <div className="label lowercase extra content">
                                (tag is optional)
                            </div>
                        </div>
                    </div>

                    <div className="fluid dead_center container padding_y margined_y">
                        <div className="ui buttons">
                            <button className="ui orange button" onClick={e=>{this.eventAliasPrivacyClick(e,"public")}}
                                id="alias_public_button">
                                Public
                            </button>
                            <div className="or"></div>
                            <button className="ui button" onClick={e=>{this.eventAliasPrivacyClick(e,"secret")}}
                                id="alias_secret_button">
                                Secret
                            </button>
                        </div>
                    </div>

                    <div className="ui centered card" id="create_alias_address_div">
                        <div className="content">
                            <div className="ui top attached tabular two item menu">
                                <div className="item active" data-tab="static"
                                    onClick={this.eventStaticMenuClick}>
                                    Static Address
                                </div>
                                <div className="item" data-tab="generate"
                                    onClick={this.eventGenerateMenuClick}>
                                    Generate Addresses on Fly
                                </div>
                            </div>
                            <div className="ui bottom attached tab segment padding active"
                                data-tab="static" id="static_address_segment">
                                {this.createStaticAddressSegment()}
                            </div>
                            <div className="ui bottom attached tab padding segment"
                                data-tab="generate" id="generate_address_segment">
                                <GenerateAddressSegment/>
                            </div>
                        </div>
			        </div>

                    <div className="content dead_center padding">
                        <div className="ui blue button">
                            Create Alias
                        </div>
                    </div>
				</div>
			</div>
        );
    }
}

CreateAlias.defaultProps = {
    hideModal: (function(){})
}