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
        this.encodeAddrInputVal = this.encodeAddrInputVal.bind(this);
        this.encodeTagInputVal = this.encodeTagInputVal.bind(this);
        this.getParsedStaticAddrHex = this.getParsedStaticAddrHex.bind(this);
        this.handleTagUpdate = this.handleTagUpdate.bind(this);
        this.handlePermissionUpdate = this.handlePermissionUpdate.bind(this);
        this.handleAddrStateUpdate = this.handleAddrStateUpdate.bind(this);
        this.handleAddrInputUpdate = this.handleAddrInputUpdate.bind(this);
        this.promiseRecurse = this.promiseRecurse.bind(this);
        this.showConfModal = this.showConfModal.bind(this);
        this.showButtonError = this.showButtonError.bind(this);
        this.hideModal = this.hideModal.bind(this);

        let tag_inp_val = this.encodeTagInputVal(props);
        let addr_inp_val = this.encodeAddrInputVal(props);
        this.state = {
            permState: props.data.permissionConfig,
            permStateOriginal: props.data.permissionConfig,
            addrState: props.data.addressConfig,
            addrStateOriginal: props.data.addressConfig,
            confModalProps: {},
            tagInputVal: tag_inp_val,
            tagValOrignal: props.tag,
            addrInputVal: addr_inp_val,
            addrValOriginal: props.data.pubAddress //Original never change based on user input
        };
        this.isDoneWhenChangeBroadcast = false;
    }

    componentWillReceiveProps(nextProps){
        let tmp_dict = {};
        if (nextProps.data.permissionConfig != this.state.permStateOriginal){
            tmp_dict.permState = nextProps.data.permissionConfig;
            tmp_dict.permStateOriginal = nextProps.data.permissionConfig;
        }
        if (nextProps.data.addressConfig != this.state.addrStateOriginal){
            tmp_dict.addrState = nextProps.data.addressConfig;
            tmp_dict.addrStateOriginal = nextProps.data.addressConfig;
        }

        let tag_inp_val = this.encodeTagInputVal(nextProps);
        let addr_inp_val = this.encodeAddrInputVal(nextProps);
        if (nextProps.data.pubAddress != this.state.addrValOriginal){
            tmp_dict.addrValOriginal = nextProps.data.pubAddress;
            tmp_dict.addrInputVal = addr_inp_val;
        }
        if (nextProps.tag != this.state.tagValOrignal){
            tmp_dict.tagValOrignal = nextProps.tag;
            tmp_dict.tagInputVal = tag_inp_val;
        }
        this.setState(tmp_dict);
    }

    encodeAddrInputVal(props){
        let addr_inp_val = "";
        if (!isZeroAddress(props.data.pubAddress)){
            addr_inp_val = base58(props.data.pubAddress);
        }
        return addr_inp_val;
    }
    encodeTagInputVal(props){
        let tag_inp_val = "";
        if (props.tag != "default"){
            tag_inp_val = props.tag;
        }
        return tag_inp_val;
    }
    getParsedStaticAddrHex(addr){
        if (addr == "") return window.zeroAddress;
        if (addr[0] == "T"){
            addr = tronWeb.address.toHex(addr);
        }
        return addr;
    }

    hideModal(e){
        this.setState({
            tagInputVal: this.encodeTagInputVal(this.props),
            addrInputVal: this.encodeAddrInputVal(this.props),
            permState: this.state.permStateOriginal,
            addrState: this.state.addrStateOriginal
        });
        this.props.hideModal();
    }

    showButtonError(errMsg, target){
        let btn_conf_params =  {
            type: "error",
            error: {text: errMsg},
            normal: {text: "Broadcast Changes"}
        };
        if (errMsg.length > 24){
            btn_conf_params.duration = 2000;
        }else{
            btn_conf_params.duration = 1500;
        }
        $(target).showButtonConf(btn_conf_params);
    }

    showConfModal(modalDict, contractSendConfig, onDoneCallback){
        console.log("conf modal", modalDict);
        let go_ahead_with_action = true;

        let setConfState = (elem, conf_dict, isError, callback)=>{
            go_ahead_with_action = false;
            $(elem).removeClass("loading");
            this.setState({confModalProps: conf_dict}, ()=>{
                if (callback) callback();
                if (onDoneCallback) onDoneCallback(isError);
            });
        }

        this.setState({confModalProps:modalDict}, ()=>{
            let is_cancelled = false;
            let is_called = false;
            $("#edit_tag_conf_modal").modal({
                closable: false,
                onApprove:(elem)=>{
                    if (!is_called && go_ahead_with_action){
                        is_called = true;
                        $(elem).addClass("loading");
                        
                        let method_config = contractSendConfig();
                        let conf_modal_dict = {
                            headerTitle: method_config.conf.headerTitle,
                            actions: ["ok"],
                            actionsText: ["Okay"]
                        };
                        window.contractSend(method_config.method,method_config.params).then(res=>{
                            console.log("txid edit tag: ", res);
                            conf_modal_dict.bodyText = method_config.conf.bodyText;
                            conf_modal_dict.iconHeader = "green";
                            conf_modal_dict.icon = "check circle outline";
                            setConfState(elem, conf_modal_dict, false, ()=>{
                                is_called = false;
                            });
                        }).catch(err=>{
                            console.log("edit tag error: ", err);
                            conf_modal_dict.bodyText = JSON.stringify(err);
                            conf_modal_dict.iconHeader = "red";
                            conf_modal_dict.icon = "close icon";
                            setConfState(elem, conf_modal_dict, true, ()=>{
                                is_called = false;
                            });
                        });
                    }
                    if (this.isDoneWhenChangeBroadcast) return true;
                    return false;
                },
                onDeny: ()=>{
                    is_cancelled = true;
                },
                onHidden: ()=>{
                    this.isDoneWhenChangeBroadcast = false;
                    if (is_cancelled){
                        $("#tag_data_modal").modal("toggle");
                    }
                }
            }).modal("show")
        });
    }


    eventDeleteTagClick(e){
        let is_default = this.props.tag == "default";
        console.log("TAG:", this.props.tag, "END");

        let conf_text_suffix = `${is_default ? "default tag": "{" + this.props.tag +"} tag"} for '${this.props.alias}' alias `;
        let conf_text_prefix = this.props.ttlTags == 1? `You are about to delete the last tag for '${this.props.alias}' alias. You'll still have ownership of this alias and no one can claim it. `:"";
        let modal_dict = {
            icon: "trash alternate",
            headerTitle: "Delete Tag for Alias",
            bodyText: `${conf_text_prefix}Are you sure you want to delete all the data associated with the ${conf_text_suffix}`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        this.showConfModal(modal_dict, ()=>{
            return {
                method: "deleteAliasTag",
                params:[
                    tronWeb.sha3(this.props.alias),
                    tronWeb.sha3(this.props.tag)
                ],
                conf:{
                    headerTitle: "Tag Delete Status",
                    bodyText: `Transaction successfully broadcasted to delete ${conf_text_suffix}. Please monitor the transaction
                    to see if contract update was successful.`
                }
            };
        });
    }

    promiseRecurse(promiseList, idx){
        if (idx >= promiseList.length){
            this.isDoneWhenChangeBroadcast = true;
            return;
        }
        console.log("promise idx:", idx);
        promiseList[idx]().then(res=>{
            console.log("idx returned: ", idx);
            this.promiseRecurse(promiseList, idx+1);
        }).catch(e=>{
            console.log("idx returned error: ", idx);
            console.log("error: ", e);
            this.isDoneWhenChangeBroadcast = true;
        })
    }

    eventSaveDataClick(e){
        let showConfMsg = (msg)=>{
            let modal_dict = {
                icon: "stop circle",
                headerTitle: `Error`,
                bodyText: msg,
                iconHeader: "orange",
                actions: ["ok"],
                actionsText: ["Okay"]
            }
            this.setState({confModalProps: modal_dict}, ()=>{
                $("#edit_tag_conf_modal").modal({
                    onHidden: ()=>{
                        $("#tag_data_modal").modal("toggle");
                    }
                }).modal("show");
            })
        }        
        if (this.state.addrInputVal != ""){
            if (!tronWeb.isAddress(this.state.addrInputVal)){
                this.showButtonError("Address is not valid", e.target);
                return;
            }
        }else if (this.state.addrInputVal == "" && this.state.addrState != "auto-gen"){
            showConfMsg("Turning off auto-generated addresses will automatically make the alias/tag resolve to static addresss. However, static address is not set. Please set it before continuing.");
            return;
        }

        if (this.state.addrState == "auto-gen" && this.props.ttlGenAddrs == 0){
            showConfMsg("You cannot set auto-generate addresses since there are not addreses to be found. Please set some addresses first.");
            return;
        }

        //if tag update is required, change the tag after modifying all other states in contract
        let promise_list = [];

        console.log("permSTate:", this.state.permState);
        if (this.state.permState != this.state.permStateOriginal){
            promise_list.push(this.handlePermissionUpdate);
        }
        console.log("addrSTate:", this.state.addrState);
        if (this.state.addrState != this.state.addrStateOriginal){
            promise_list.push(this.handleAddrStateUpdate);
        }

        if (this.getParsedStaticAddrHex(this.state.addrInputVal) != this.props.data.pubAddress){
            promise_list.push(this.handleAddrInputUpdate);
        }

        if (this.state.tagInputVal != this.props.tag){
            promise_list.push(this.handleTagUpdate);
        }
        console.log(promise_list);
        if (promise_list.length > 0){
            this.promiseRecurse(promise_list, 0);
        }else{
            this.showButtonError("No Changes Made!", e.target);
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

    handleTagUpdate(){
        let is_default_orig = this.props.tag == "default";
        let new_tag = (this.state.tagInputVal == ""? "default": this.state.tagInputVal);

        let conf_text_suffix = `${is_default_orig ? "default tag": "{" + this.props.tag +"} tag"} for '${this.props.alias}' alias`;
        let modal_dict = {
            icon: "tag",
            headerTitle: "Update Tag for Alias",
            bodyText: `Are you sure you want to update ${conf_text_suffix} to ${new_tag} tag?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }
        return new Promise((resolve,reject)=>{
            this.showConfModal(modal_dict, ()=>{
                return {
                    method: "updateTag",
                    params:[
                        tronWeb.sha3(this.props.alias),
                        tronWeb.sha3(this.props.tag),
                        encryptData(this.props.tag),
                        tronWeb.sha3(new_tag),
                        encryptData(new_tag)
                    ],
                    conf:{
                        headerTitle: "Tag Update Status",
                        bodyText: `Transaction successfully broadcasted to update ${conf_text_suffix} to ${new_tag} tag. Please monitor the transaction
                        to see if contract update was successful.`
                    }
                };
            }, (isError)=>{
                if (isError) reject();
                else resolve();
            });
        });
        
    }
    handlePermissionUpdate(){
        let conf_text_suffix = `permission state from ${this.state.permStateOriginal} to ${this.state.permState}`;
        let modal_dict = {
            icon: "toggle on",
            headerTitle: `Update Permission State for Tag`,
            bodyText: `Are you sure you want to update ${conf_text_suffix}?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        return new Promise((resolve,reject)=>{
            this.showConfModal(modal_dict, ()=>{
                return {
                    method: "updateTagIsSecret",
                    params:[
                        tronWeb.sha3(this.props.alias),
                        tronWeb.sha3(this.props.tag),
                        (this.state.permState == "secret" ? true:false)
                    ],
                    conf:{
                        headerTitle: "Tag Permission Update Status",
                        bodyText: `Transaction successfully broadcasted to update ${conf_text_suffix}. Please monitor the transaction
                        to see if contract update was successful.`
                    }
                };
            }, (isError)=>{
                if (isError) reject();
                else resolve();
            });
        });
    }
    handleAddrStateUpdate(){
        console.log("addrstate alias:", this.props.alias);
        console.log("addrstate tag:", this.props.tag);

        let conf_text_suffix = `address generation state from ${this.state.addrStateOriginal} to ${this.state.addrState}`;
        let modal_dict = {
            icon: "toggle on",
            headerTitle: `Update Address Generation State for Tag`,
            bodyText: `Are you sure you want to update ${conf_text_suffix}?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        return new Promise((resolve,reject)=>{
            this.showConfModal(modal_dict, ()=>{
                return {
                    method: "updateGenAddressFlag",
                    params:[
                        tronWeb.sha3(this.props.alias),
                        tronWeb.sha3(this.props.tag),
                        (this.state.addrState == "auto-gen" ? true:false)
                    ],
                    conf:{
                        headerTitle: "Address Generation Update Status",
                        bodyText: `Transaction successfully broadcasted to update ${conf_text_suffix}. Please monitor the transaction
                        to see if contract update was successful.`
                    }
                };
            }, (isError)=>{
                if (isError) reject();
                else resolve();
            });
        });
    }

    handleAddrInputUpdate(){
        let is_default_orig = this.props.tag == "default";
        let conf_text_suffix = `${is_default_orig ? "default tag": "{" + this.props.tag +"} tag"} for '${this.props.alias}' alias`;
        let is_pub_unset = (this.state.addrInputVal == ""? true:false);
        let body_text;
        if (is_pub_unset){
            body_text = `Are you sure you want to unset public address for ${conf_text_suffix}? Auto-gen option has to be turned on
            since either static or auto-gen must be on at any given time. Setting the public address to empty turns static 
            address option off.`;
        }else{
            body_text = `Are you sure you want to update public address for ${conf_text_suffix} to ${this.state.addrInputVal}?`;
        }
       
        let modal_dict = {
            icon: "address card outline",
            headerTitle: "Update Public Address for Tag",
            bodyText: body_text,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        return new Promise((resolve,reject)=>{
            this.showConfModal(modal_dict, ()=>{
                return {
                    method: "updatePubAddressForTag",
                    params:[
                        tronWeb.sha3(this.props.alias),
                        tronWeb.sha3(this.props.tag),
                        this.getParsedStaticAddrHex(this.state.addrInputVal)
                    ],
                    conf:{
                        headerTitle: "Public Address Update Status",
                        bodyText: `Transaction successfully broadcasted to update public address for ${conf_text_suffix}. Please monitor the transaction
                        to see if contract update was successful.`
                    }
                };
            }, (isError)=>{
                if (isError) reject();
                else resolve();
            });
        });
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
            let val = $(e.target).val().trim();
            val = val.replace(/[^a-zA-Z0-9_]/g, "");
            val = val.toLowerCase();
            $(e.target).val(val);
            this.setState({tagInputVal: val});
        }
        let getDescription =()=>{
            if(this.props.tag != "default"){
                return(
                    <p className="disabled_text lineheight text_center">
                        You can update the tag to be empty if you want it to be the default tag
                        for an alias.
                    </p>
                );
            }
        }
        return(
            <div>
                {getDescription()}
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
            </div>
        );
    }

    createStaticAddressEdit(){
        let onChange=(e)=>{
            let val = $(e.target).val().trim();
            val = val.replace(/[^a-zA-Z0-9_]/g, "");
            this.setState({addrInputVal: val});
        }
        return(
            <div className="ui tiny fullwidth statistic">
                <div className="value">
                    <div className="ui transparent small input">
                        <input type="text" placeholder="Public Address"
                            className="text_center purple_input" autoComplete="off" spellCheck="false"
                            id="edit_static_addr_input" value={this.state.addrInputVal} onChange={e=>onChange(e)}
                            maxLength="34"/>
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
            current: this.state.permState == "public"?"first":"second"
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
            current: this.state.addrState == "static"?"first":"second"
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
            if (this.props.tag != "default")
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
                            <button className="ui right floated icon circular button" onClick={e=>{this.hideModal(e)}}>
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
    ttlTags: 0,
    ttlGenAddrs:0,
    data: {
        pubAddress: "",
        permissionConfig: "",
        addressConfig: ""
    }
}