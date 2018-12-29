import React from "react";
import ConfirmationModal from "./ConfirmationModal.js";

export default class EditTagDataModal extends React.Component{
    constructor(props){
        super(props);
        
        this.createTagEdit = this.createTagEdit.bind(this);
        this.createStaticAddressEdit = this.createStaticAddressEdit.bind(this);
        this.createConfToggles = this.createConfToggles.bind(this);
        this.eventSaveDataClick = this.eventSaveDataClick.bind(this);
        this.createOptionButton = this.createOptionButton.bind(this);
        this.eventOptionButtonClick = this.eventOptionButtonClick.bind(this);
        this.eventDeleteTagClick = this.eventDeleteTagClick.bind(this);
        this.parseInputValues = this.parseInputValues.bind(this);

        let [tag_inp_val, addr_inp_val] = this.parseInputValues(props);
        this.state = {
            permState: props.data.permissionConfig,
            addrState: props.data.addressConfig,
            confModalProps: {},
            tagInputVal: tag_inp_val,
            addrInputVal: addr_inp_val
        };
    }

    componentWillReceiveProps(nextProps){
        let tmp_dict = {};
        if (nextProps.data.permissionConfig != this.state.permState){
            tmp_dict.permState = nextProps.data.permissionConfig;
        }
        if (nextProps.data.addressConfig != this.state.addrState){
            tmp_dict.addrState = nextProps.data.addressConfig;
        }
  
        let [tag_inp_val, addr_inp_val] =  this.parseInputValues(nextProps);
        tmp_dict.tagInputVal = tag_inp_val;
        tmp_dict.addrInputVal = addr_inp_val;
        this.setState(tmp_dict);
    }

    parseInputValues(props){
        let addr_inp_val = "";
        if (!isZeroAddress(props.data.pubAddress)){
            addr_inp_val = base58(props.data.pubAddress);
        }
        let tag_inp_val = "";
        if (props.tag != "default"){
            tag_inp_val = props.tag;
        }
        return [tag_inp_val, addr_inp_val];
    }

    eventDeleteTagClick(e){

    }

    eventSaveDataClick(e){
        let contract_params = [
            tronWeb.sha3(alias),
            window.hexToBytes32(encryptData(alias)),
            tronWeb.sha3(tag),
            window.hexToBytes32(encryptData(tag)),
            (isStatic? tronWeb.address.toHex(this.getStaticAddr()): this.state.genAddrs)
        ];
        console.log("params: ", contract_params);
        window.contractSend(isStatic?"setAliasStatic": "setAliasGenerated", contract_params).then(res=>{
            console.log("setAliasRes: ", res);
            modal_dict.bodyText = `Transaction for alias creation successfully broadcasted. Hopefully
                someone else doesn't get it first.`;
            modal_dict.iconHeader = "green";
            setConfState();
        }).catch(err=>{
            console.log("setAliasErr: ", err);
            modal_dict.bodyText = err;
            modal_dict.iconHeader = "red";
            setConfState();
        });


        if (this.state.tagInputVal != this.props.tag){

        }

        if (this.props.data.permissionConfig != this.state.permState){

        }

        if (this.props.data.addressConfig != this.state.addrState){

        }

        if (this.state.addrInputVal != this.props.data.pubAddress){

        }
    }

    eventOptionButtonClick(e, btnState, color,state, btnArgs){
        if (btnState == "first"){
            $("#" + btnArgs.second.id).removeClass(color);
            $("#" + btnArgs.first.id).addClass(color);
            this.setState({[state]: btnArgs.first.text});
        }else{
            $("#" + btnArgs.first.id).removeClass(color);
            $("#" + btnArgs.second.id).addClass(color);
            this.setState({[state]: btnArgs.second.text});
        }
    }

    createOptionButton(color, state, btnArgs){
        let first_class = "ui button " + ((btnArgs.current == "first")?color:"");
        let second_class = "ui button " + ((btnArgs.current == "second")?color:"");

        return(
            <div className="ui buttons">
                <button className={first_class}
                    onClick={e=>{this.eventOptionButtonClick(e,"first",color, state, btnArgs)}}
                    id={btnArgs.first.id}>
                    {btnArgs.first.text}
                </button>
                <div className="or"></div>
                <button className={second_class}
                    onClick={e=>{this.eventOptionButtonClick(e,"second",color, state, btnArgs)}}
                    id={btnArgs.second.id}>
                    {btnArgs.second.text}
                </button>
            </div>
        );
    }

    createTagEdit(){
        let onChange=(e)=>{
            this.setState({tagInputVal: $(e.target).val().trim()});
        }
        return(
            <div className="ui tiny fullwidth statistic">
                <div className="value">
                    <div className="ui transparent large input">
                        <input type="text" placeholder="Tag"
                            className="text_center purple_input" autoComplete="off" spellCheck="false"
                            id="edit_tag_input" value={this.state.tagInputVal} onChange={e=>onChange(e)}
                            maxLength="20"/>
                    </div>
                </div>
                <div className="label initialcase">
                    Tag for Alias
                </div>
            </div>
        );
    }

    createStaticAddressEdit(){
        let onChange=(e)=>{
            this.setState({addrInputVal: $(e.target).val().trim()});
        }
        return(
            <div className="ui tiny fullwidth statistic">
                <div className="value">
                    <div className="ui transparent small input">
                        <input type="text" placeholder="Public Address"
                            className="text_center purple_input" autoComplete="off" spellCheck="false"
                            id="edit_static_addr_input" value={this.state.addrInputVal} onChange={e=>onChange(e)}
                            maxLength="20"/>
                    </div>
                </div>
                <div className="label initialcase">
                    Static Address
                </div>
            </div>
        );
    }

    createConfToggles(){
        let key = [this.props.alias,this.props.tag];
        let permission_btn_args = {
            first: {
                text: "public",
                id: ["public",...key].join("_")
            },
            second: {
                text: "secret",
                id: ["secret",...key].join("_")
            },
            current: this.props.data.permissionConfig == "public"?"first":"second"
        };
        let address_btn_args = {
            first: {
                text: "static",
                id: ["static",...key].join("_")
            },
            second: {
                text: "auto-gen",
                id: ["auto-gen",...key].join("_")
            },
            current: this.props.data.addressConfig == "static"?"first":"second"
        };
        return([
            <div className="column center aligned" key={["permission",...key].join("_")}>
                {this.createOptionButton("orange", "permState", permission_btn_args)}
            </div>,
            <div className="column center aligned" key={["address",...key].join("_")}>
                {this.createOptionButton("pink", "addrState", address_btn_args)}
            </div>
        ]);
    }

    render(){
        let getTitle = ()=>{
            if (this.props.tag == "" || this.props.tag != "default")
                return "Edit Tag Data";
            else    
                return "Edit Empty (default) Tag Data";
        }
        let getSubHeader= ()=>{
            if (this.props.tag != "" && this.props.tag != "default")
                return `for ${"`" + this.props.alias + "` {" + this.props.tag + "}"}`
            else
                return `for ${"`" + this.props.alias + "` alias"}`
        }
        let getDescription = ()=>{
            if (this.props.tag == "default"){
                return(
                    <div className="fluid dead_center lineheight margined_y text_center container">
                        You are editing info for an empty tag, which means it's the same as editing 
                        info for an alias without a tag. 
                    </div>
                );
            }
        }
        return(
            <div className="ui modal tns_modal" id="tag_data_modal">
				<div className="ui blurring segment modal_layout_segment">
					<div className="ui centered three column grid row margined_b">
                        <div className="one wide column"></div>
                        <div className="fourteen wide column padding_y">
                            <div className="ui huge center aligned header no_user_select">
                                {getTitle()}
                                <div className="sub header">
                                    {getSubHeader()}
                                </div>
                            </div>
                        </div>
                        <div className="one wide column">
                            <button className="ui right floated icon circular button" onClick={e=>{this.props.hideModal(e)}}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="alot padding_x">
                        {getDescription()}
                        <div className="margined">
                            {this.createTagEdit()}
                        </div>
                        <div className="margined ui two column row stackable grid">
                            {this.createConfToggles()}
                        </div>
                        <div className="margined_y">
                            {this.createStaticAddressEdit()}
                        </div>
                       

                        <div className="content dead_center padding">
                            <div className="ui buttons edit_tag_buttons">
                                <button className="ui button" onClick={e=>{this.eventSaveDataClick(e)}}>
                                    Broadcast Changes
                                </button>
                                <div className="or"></div>
                                <button className="ui button" onClick={e=>{this.eventDeleteTagClick(e)}}>
                                    Delete tag & all its data
                                </button>
                            </div>
                           
                        </div>
                    </div>
                </div>
                <ConfirmationModal id="edit_tag_conf_modal" {...this.state.confModalProps}/>
            </div>
        );
    }
}

EditTagDataModal.defaultProps = {
    hideModal: (function(){}),
    alias: "",
    tag: "",
    data: {
        pubAddress: "",
        permissionConfig: "",
        addressConfig: ""
    }
}