import React from "react";
import Equal from "deep-equal";
import get from "axios";
import ConfirmationModal from "./ConfirmationModal.js";
import { decrypt } from "ethers/utils/secret-storage";

export default class SecretUsers extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            usersList: this.parseUsersList(props.usersList),
            alias: props.alias,
            props: props.tag,
            secretUserAppendInputVal: "",
            confModalProps: {},
            replaceUserListState: "editable",
            replaceUserList: []
        };
        this.createSecretUserTable = this.createSecretUserTable.bind(this);
        this.createSecretUserRows = this.createSecretUserRows.bind(this);
        this.createAddSecretUserSegment = this.createAddSecretUserSegment.bind(this);
        this.createReplaceListUserSegment = this.createReplaceListUserSegment.bind(this);
        this.createLabeledAddresses = this.createLabeledAddresses.bind(this);
        this.eventAppendSecretUserClick = this.eventAppendSecretUserClick.bind(this);
        this.eventDeleteSecretUserClick = this.eventDeleteSecretUserClick.bind(this);
        this.eventReplaceSecretUserListClick = this.eventReplaceSecretUserListClick.bind(this);
        this.eventReplaceListInputBlur = this.eventReplaceListInputBlur.bind(this);
        this.eventReplaceListOnChange = this.eventReplaceListOnChange.bind(this);
        this.showButtonError = this.showButtonError.bind(this);
        this.parseUsersList = this.parseUsersList.bind(this);
        this.encryptAddress = this.encryptAddress.bind(this);
        this.showConfModal = this.showConfModal.bind(this);
        this.hideModal = this.hideModal.bind(this);

        this.maxUsers = 10;
    }

    componentWillReceiveProps(nextProps){
        let tmp_dict = {};
		if (!Equal(nextProps.usersList, this.props.usersList)){
            tmp_dict.usersList = this.parseUsersList(nextProps.usersList);
		}
		if (!Equal(nextProps.alias, this.props.alias)){
			tmp_dict.alias = nextProps.alias;
        }
        if (!Equal(nextProps.tag, this.props.tag)){
			tmp_dict.tag = nextProps.tag;
        }
        if (Object.keys(tmp_dict).length > 0){
            this.setState(tmp_dict);
        }
        
    }

    hideModal(e){
        this.setState({toShowAddUserSegment: false});
        this.props.hideModal();
    }

    parseUsersList(usersList){
        let res_list = [];
        if (usersList.length % 2 == 0 && usersList.length != 0){
            for (let addr_idx = 0; addr_idx < usersList.length - 1; addr_idx+=2){
                let first_hex = decodeEncryptFormat(usersList[addr_idx]);
                let sec_hex = decodeEncryptFormat(usersList[addr_idx + 1]);
                res_list.push(decryptData(first_hex + sec_hex));
            }
        }
        
        return res_list;
    }

    encryptAddress(addrList){
        let res_list = [];
        for (let addr of addrList){
            let fullhex = encryptData(addr,false);
            let sec_hex = hexToBytes32(fullhex.substring(fullhex.length-64,fullhex.length));
            let first_hex = hexToBytes32(ENC_PREFIX_HEX + fullhex.substring(0, fullhex.length-64));
            res_list.push({
                firstHex: first_hex,
                secondHex: sec_hex
            });
        }
       return res_list;
    }

    showButtonError(errMsg, target){
        let btn_conf_params =  {
            type: "error",
            error: {text: errMsg},
            normal: {text: $(target).text()}
        };
        if (errMsg.length > 24){
            btn_conf_params.duration = 2000;
        }
        $(target).showButtonConf(btn_conf_params);
    }


    showConfModal(modalDict, contractSendConfig, onDoneCallback){
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
            let is_called = false;
            $("#secret_users_conf_modal").modal({
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
                        return false;
                    }
                    
                },
                onHidden: ()=>{
                    $("#secret_users_modal").modal("toggle");
                }
            }).modal("show")
        });
    }

    eventReplaceSecretUserListClick(e){
        if (this.state.replaceUserList.length == 0){
            this.showButtonError("No addresses found!", e.target);
            return;
        }else if (this.state.replaceUserList.length >= 10){
            this.showButtonError("Up to 10 users allowed, or choose public setting", e.target);
            return;
        }

        let getBase58Addr = (addr)=>{
            if (addr != "T") return base58(addr);
            return addr;
        }
        let base58_addrs = new Set();
        for (let user of this.state.replaceUserList){
            if (!tronWeb.isAddress(user)){
                this.showButtonError("Address(s) is not valid!", e.target);
                return;
            }else if (base58_addrs.has(user) || this.state.usersList.includes(user)){
                this.showButtonError("Duplicate address found in list", e.target);
                return;
            }
            let base58_addr = getBase58Addr(user);
            if (base58_addr == tronWeb.defaultAddress.base58){
                this.showButtonError("Cannot hide alias/tag from yourself :)", e.target);
                return;
            }
            base58_addrs.add(base58_addr);
        }

        let is_default = this.state.tag == "default";
        let conf_text_suffix = `${is_default ? "default tag": "{" + this.state.tag +"} tag"} for '${this.state.alias}' alias`;
        let modal_dict = {
            icon: "file alternate outline",
            headerTitle: "Add & Replace Secret Users for Tag",
            bodyText: `Are you sure you want to add make ${conf_text_suffix} only visible to additional ${base58_addrs.size} users?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        let encryptedAddrList = this.encryptAddress(base58_addrs);
        for (let addr of encryptedAddrList){
            if (addr.firstHex.length != 66 && addr.secondHex.length !=66){
                this.showButtonError("Unable to encrypt address", e.target);
                return;
            }
        }
        let getParsedEncAddrs = (encAddrs)=>{
            let res_list = [];
            for (let addr of encAddrs){
                res_list.push(addr.firstHex);
                res_list.push(addr.secondHex);
            }
            return res_list;
        }
        let getKeccakAddrs = (addrList)=>{
            let res_list = [];
            for (let addr of addrList){
                res_list.push(tronWeb.sha3(addr));
            }
            return res_list;
        }

        this.showConfModal(modal_dict, ()=>{
            return {
                method: "updateTagSecretUserList",
                params:[
                    tronWeb.sha3(this.state.alias),
                    tronWeb.sha3(this.state.tag),
                    getKeccakAddrs(base58_addrs),
                    getParsedEncAddrs(encryptedAddrList)
                ],
                conf:{
                    headerTitle: "Status for Update Secret Users List",
                    bodyText: `Transaction successfully broadcasted to add ${base58_addrs.size} secret addresses. Please monitor the transaction
                    to see if contract update was successful.`
                }
            };
        });

    }

    eventAppendSecretUserClick(e){
        let new_addr = $("#secret_user_append_addr_input").val().trim();
        if (!tronWeb.isAddress(new_addr)){
            this.showButtonError("Address is not valid!", e.target);
            return;
        }else if (this.state.usersList.length >= 10){
            this.showButtonError("Up to 10 users allowed, or choose public setting", e.target);
            return;
        }

        let getBase58Addr = (addr)=>{
            if (addr != "T") return base58(addr);
            return addr;
        }
        new_addr = getBase58Addr(new_addr);
        if (new_addr == tronWeb.defaultAddress.base58){
            this.showButtonError("Cannot hide alias/tag from yourself :)", e.target);
            return;
        }else if (this.state.usersList.includes(new_addr)){
            this.showButtonError("Secret user address already exists!", e.target);
            return;
        }

        let is_default = this.state.tag == "default";
        let conf_text_suffix = `${is_default ? "default tag": "{" + this.state.tag +"} tag"} for '${this.state.alias}' alias`;
        let modal_dict = {
            icon: "plus square outline",
            headerTitle: "Append Secret User for Tag",
            bodyText: `Are you sure you want to append address ${new_addr} for ${conf_text_suffix}?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }
        
        let encryptedAddr = this.encryptAddress([new_addr])[0];
        if (encryptedAddr.firstHex.length != 66 && encryptedAddr.secondHex.length !=66){
            this.showButtonError("Unable to encrypt address", e.target);
            return;
        }

        this.showConfModal(modal_dict, ()=>{
            return {
                method: "updateTagSecretUserListAppend",
                params:[
                    tronWeb.sha3(this.state.alias),
                    tronWeb.sha3(this.state.tag),
                    tronWeb.sha3(new_addr),
                    [encryptedAddr.firstHex,encryptedAddr.secondHex]
                ],
                conf:{
                    headerTitle: "Status for Append Address to Secret Users List",
                    bodyText: `Transaction successfully broadcasted to append address ${new_addr}. Please monitor the transaction
                    to see if contract update was successful.`
                }
            };
        });

    }

    eventDeleteSecretUserClick(e,idx){
        let is_default = this.state.tag == "default";
        let conf_text_suffix = `${is_default ? "default tag": "{" + this.state.tag +"} tag"} for '${this.state.alias}' alias`;
        let modal_dict = {
            icon: "trash alternate",
            headerTitle: "Delete Secret User Address for Tag",
            bodyText: `Are you sure you want to delete address ${this.state.usersList[idx]} for ${conf_text_suffix}?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        this.showConfModal(modal_dict, ()=>{
            return {
                method: "updateTagSecretUserDelete",
                params:[
                    tronWeb.sha3(this.state.alias),
                    tronWeb.sha3(this.state.tag),
                    tronWeb.sha3(this.state.usersList[idx]),
                    idx
                ],
                conf:{
                    headerTitle: "Status for Delete Address from Secret Users List",
                    bodyText: `Transaction successfully broadcasted to delete address ${this.state.usersList[idx]}. Please monitor the transaction
                    to see if contract update was successful.`
                }
            };
        });
    }

    eventReplaceListInputBlur(e){
        let val = $(e.target).val().trim();
        let split_val = val.split("\n");
        let res_val = [];

        for (let idx = 0; idx < split_val.length; idx++){
            if (res_val.length >= this.maxUsers) break;
            let tmp_val = split_val[idx].trim();
            if (tmp_val != ""){
                res_val.push(tmp_val);
            }
        }
        this.setState({replaceUserListState: "uneditable", replaceUserList: res_val});
    }

    eventReplaceListOnChange(e){
        let val = $(e.target).val();
        val = val.replace(/[^a-zA-Z0-9\n]/g, "");
        $(e.target).val(val);
    }

    createAddSecretUserSegment(){
        let onChange=(e)=>{
            let val = $(e.target).val().trim();
            val = val.replace(/[^a-zA-Z0-9]/g, "");
            this.setState({secretUserAppendInputVal: val});
        }

        return(
            <div>
                <div className="ui mini fullwidth statistic">
                    <div className="value">
                        <div className="ui transparent small input">
                            <input type="text" placeholder="Public Address"
                                className="text_center purple_input" autoComplete="off" spellCheck="false"
                                value={this.state.secretUserAppendInputVal} onChange={e=>onChange(e)}
                                maxLength="34" id="secret_user_append_addr_input"/>
                        </div>
                    </div>
                    <div className="label initialcase padding_t">
                        Public Address
                    </div>
                </div>
                <div className="fluid container dead_center">
                    <button className="ui green center aligned button margined_t" onClick={e=>{this.eventAppendSecretUserClick(e)}}>
                        Broadcast Append Address
                    </button>
                </div>
            </div>
        );
        
    }
    createSecretUserRows(){
        let row_list = [];
        for(let idx = 0; idx < this.state.usersList.length; idx++){
            let addr = this.state.usersList[idx];
            console.log("secret addr:",addr);
            row_list.push(
                <tr key={addr}>
                    <td className="center aligned">
                        <div className="ui circular label no_user_select">
                            {idx+1}
                        </div>
                    </td>
                    <td className="center aligned">
                        {addr}
                    </td>
                    <td className="center aligned">
                        <i className="ui red trash large alternate icon gen_delete_icon" onClick={e=>{this.eventDeleteSecretUserClick(e,idx)}}/>
                    </td>
                </tr>
            );
        }
        return row_list;
    }

    createReplaceListUserSegment(){
        let onUneditableClick = (e)=>{
            this.setState({replaceUserListState: "editable"}, ()=>{
                $("#secret_user_list_textarea").focus();
            });
        }
        let getReplaceListEditableSegment = ()=>{
            if (this.state.replaceUserListState == "editable"){
                return(
                    <div className="ui fluid input">
                        <textarea type="text" placeholder="Paste your list of addresses one per line"
                            autoComplete="off" spellCheck="false"
                            onChange={e=>{this.eventReplaceListOnChange(e)}}
                            onBlur={e=>{this.eventReplaceListInputBlur(e)}}
                            defaultValue={this.state.replaceUserList.join("\n")}
                            rows="5" cols="34" id="secret_user_list_textarea"></textarea>
                    </div>
                );
            }else{
                return(
                    <div className="ui basic segment secret_replace_list_segment"
                        onClick={e=>{onUneditableClick(e)}}>
                        {this.createLabeledAddresses()}
                    </div>
                );
            }
        }
        return(
            <div>
                {getReplaceListEditableSegment()}
                <div className="fluid container dead_center">
                    <button className="ui green center aligned button margined_t" onClick={e=>{this.eventReplaceSecretUserListClick(e)}}>
                        Broadcast Secret Users List
                    </button>
                </div>
            </div>
        );
    }
    createLabeledAddresses(){
        let addrLabels = ()=>{
            let res_list = [];
            let col_len = 2;
            for (let row = 0; row < (this.state.replaceUserList.length/col_len); row++){
                let start_idx = (row * col_len);
                let res_row_list = [];
                for (let idx = start_idx; idx < (start_idx + col_len); idx++){
                    let addr = " ";
                    if (idx < this.state.replaceUserList.length){
                        addr = this.state.replaceUserList[idx];
                        res_row_list.push(
                            <div className="column" key={"mnemonic_col_" + idx}>
                                <div className="dead_center">
                                    <div className="secret_address_detail">{idx+1}</div>
                                    <div className="ui label center aligned secret_address">
                                        {addr}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                }
                res_list.push(
                    <div className={row > 0 ? "no_padding_t centered row": "centered row"} key={"mnemonic_row_" + row}>
                        {res_row_list}
                    </div>
                );
            }
            return res_list;
        }

        return(
            <div className="ui two column stackable doubling grid container">
                {addrLabels()}
            </div>
        );
    }

    createSecretUserTable(){
        return(
            <table className="ui striped collapsing auto_margin table">
                <thead>
                    <tr className="center aligned">
                        <th></th>
                        <th>Public Address</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {this.createSecretUserRows()}
                </tbody>
            </table>
        );
    }

    render(){
        return(
            <div className="ui modal tns_modal" id="secret_users_modal">
				<div className="ui blurring segment modal_layout_segment">
					<div className="ui centered three column grid row margined_b">
                        <div className="one wide column"></div>
                        <div className="fourteen wide column padding_y">
                            <div className="ui huge center aligned purple_header header">
                                Secret Users
                                <div className="sub header">
                                    for `{this.state.alias}` alias
                                </div>
                            </div>
                        </div>
                        <div className="one wide column">
                            <button className="ui right floated icon circular button" onClick={e=>{this.hideModal(e)}}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="padding_x" id="secret_users_edit_main_div">
                        <div className="fluid dead_center lineheight margined_y text_center container">
                            With secret users, you can make sure that only selected people will see your alias/tag
                            if current setting is set to 'secret'. Anyone else will not be able to resolve what
                            address your alias points to. Below you can create & replace multiple secret users
                            at once (up to 10) or append their new address to your secret users list.
                        </div>
                        <div className="fluid dead_center disabled_text container">
                            Only the alias owner can see the decrypted account addresses.
                        </div>

                        <div className="margined_y">
                            {this.createSecretUserTable()}
                        </div>

                        <div className="ui centered card margined_b alias_round_tab_menu fullwidth">
                            <div className="content no_padding_x">
                                <div className="ui top attached tabular two item menu no_border">
                                    <div className="item active" data-tab="append_secret_user"
                                        onClick={this.eventStaticMenuClick}>
                                        Append User
                                    </div>
                                    <div className="item" data-tab="new_secret_list"
                                        onClick={this.eventGenerateMenuClick}>
                                        Add & Replace Multiple Users
                                    </div>
                                </div>
                                <div className="ui bottom attached tab segment very padded active menu_left_segment"
                                    data-tab="append_secret_user">
                                    {this.createAddSecretUserSegment()}
                                </div>
                                <div className="ui bottom attached tab padded segment menu_right_segment"
                                    data-tab="new_secret_list">
                                    {this.createReplaceListUserSegment()}
                                </div>
                            </div>
                        </div>
                       
                    </div>
                </div>
                <ConfirmationModal id="secret_users_conf_modal" {...this.state.confModalProps}/>
            </div>
        );
    }
}

SecretUsers.defaultProps = {
    hideModal: (function(){}),
    alias: "",
    tag: "",
    usersList:[]
}