import React from "react";
import GenerateAddressSegment from "./GenerateAddressSegment.js";
import to from 'await-to-js';
import ConfirmationModal from "./ConfirmationModal.js";
import get from "axios";

export default class CreateAlias extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            aliasSize: "0",
            tagSize: "0",
            confModalProps: {},
            genAddrs: []
        };
        this.eventCloseCreateAliasModal = this.eventCloseCreateAliasModal.bind(this);
        this.eventAliasOnChange = this.eventAliasOnChange.bind(this);
        this.eventTagOnChange = this.eventTagOnChange.bind(this);
        this.createStaticAddressSegment = this.createStaticAddressSegment.bind(this);
        this.eventStaticAddressOnChange = this.eventStaticAddressOnChange.bind(this);
        this.eventCreateAliasClick = this.eventCreateAliasClick.bind(this);
        this.updateGenAddrs = this.updateGenAddrs.bind(this);
        this.createAliasPrecheck = this.createAliasPrecheck.bind(this);
        this.isStaticAddr = this.isStaticAddr.bind(this);
        this.getStaticAddr = this.getStaticAddr.bind(this);
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

    eventAliasOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9_]/g, "");
        val = val.toLowerCase();
        $(e.target).val(val);
        let input_len = Math.ceil(val.length - (val.length * 0.10));
        let max_len = Math.max(input_len , $(e.target).attr("placeholder").length);
        this.setState({aliasSize: max_len});
    }

    eventTagOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9_]/g, "")
        val = val.toLowerCase();
        $(e.target).val(val);
        let input_len = Math.ceil(val.length - (val.length * 0.20));
        let max_len = Math.max(input_len, $(e.target).attr("placeholder").length);
        this.setState({tagSize: max_len});
    }

    eventStaticAddressOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9]/g, "")
        $(e.target).val(val);
    }

    updateGenAddrs(genAddrsList){
        this.setState({genAddrs: genAddrsList}, ()=>{
            console.log("genaddrs updated: ", this.state.genAddrs);
        });
    }

    getStaticAddr(){
        let static_addr = $("#static_address_input").val().trim();
        if (tronWeb.isAddress(static_addr)){
            if (static_addr[0] != "T"){
                static_addr = tronWeb.address.fromHex(static_addr);
            }
            return static_addr;
        }else return null;
    }

    isStaticAddr(){
        let static_addr = $("#static_address_input").val().trim();
        if (static_addr != "" && this.state.genAddrs.length != 0) return -1;
        else if (static_addr == "" && this.state.genAddrs.length == 0) return -2;
        else if (static_addr != "") return 1;
        else return 0;
    }

    createAliasPrecheck(alias){
        return new Promise((resolve, reject)=>{
            if (alias != ""){
                let is_static = this.isStaticAddr();
                if (is_static == -1){
                    reject(`Can't set both static & generated 
                        addresses during creation. Please remove one.`);

                }else if (is_static == -2){
                    reject(`No static or generated address(s) found`);
                }else if (is_static == 1){
                    if (this.getStaticAddr() == null){
                        reject(`Static address is not valid`);
                    }
                }else if (is_static == 0){
                    if (this.state.genAddrs.length == 0){
                        reject(`No generated addresses found`);
                    }
                }
                resolve(is_static);
            }else{
                reject("Alias is empty");
            }
        });
    }
    eventCreateAliasClick(e){
        e.persist();
        let alias = $("#create_alias_input").val().trim();
        let tag = $("#create_tag_input").val().trim();
        let is_succeeded = false;
        tag = (tag == "" ? "default": tag);
        
        $(e.target).addClass("loading");

        let showBtnError = (errMsg)=>{
            console.log("btnerr:", errMsg);
            $(e.target).removeClass("loading");
            let btn_conf_params =  {
                type: "error",
                error: {text: errMsg},
                normal: {text: "Create Alias"}
            };
            if (errMsg.length > 24){
                btn_conf_params.duration = 2000;
            }
            $(e.target).showButtonConf(btn_conf_params);
        }
        let modal_dict = {
            icon: "list alternate outline",
            headerTitle: "Create Alias Transaction"
        }
        let setConfState = ()=>{
            this.setState({confModalProps: modal_dict}, ()=>{
                $(e.target).removeClass("loading");
                $("#create_alias_conf_modal").modal({
                    closable: false,
                    onHidden: ()=>{
                        if (!is_succeeded){
                            $("#create_alias_modal").modal("toggle");
                        }
                    }
                }).modal("show");
            });
        }
        let setAlias = (isStatic)=>{
            let contract_params = [
                tronWeb.sha3(alias),
                encryptData(alias),
                tronWeb.sha3(tag),
                encryptData(tag),
                (isStatic? tronWeb.address.toHex(this.getStaticAddr()): this.state.genAddrs)
            ];
            console.log("params: ", contract_params);
            window.contractSend(isStatic?"setAliasStatic": "setAliasGenerated", contract_params).then(res=>{
                console.log("setAliasRes: ", res);
                modal_dict.bodyText = `Transaction for alias creation successfully broadcasted. Hopefully
                    someone else doesn't get it first. You can monitor your transaction in 'My Activity' tab to see if
                    contract update succeeded.`;
                modal_dict.iconHeader = "green";
                is_succeeded = true;
                setConfState();
            }).catch(err=>{
                console.log("setAliasErr: ", err);
                modal_dict.bodyText = err;
                modal_dict.iconHeader = "red";
                setConfState();
            });
        }
        this.createAliasPrecheck(alias).then(async (isStatic)=>{
            alias = alias.toLowerCase();
            tag = tag.toLowerCase();
            let [err, res] = await to(get(`api/aliasAvailable/${alias}`,{params:{raw:true}}));
            try{
                if (!err && !("error" in res.data)){
                    if (res.data.result == true){
                        setAlias(isStatic);
                    }else{
                        let def_addr = tronWeb.defaultAddress.hex;
                        let [err, res] = await to(get(`api/aliasOwner/${alias}`,{params:{raw:true}}));
                        if (!err){
                            console.log("returned owner: ", res.data.result);
                            if (res.data.result == def_addr){
                                let [err, res] = await to(get(`api/tagAvailable/${alias}/${tag}`,{params:{raw:true}}));
                                if (!err){
                                    if (res.data.result == true){
                                        setAlias(isStatic);
                                    }else showBtnError("Tag already exists for alias");
                                }else throw(err);
                            }else showBtnError("Alias is already taken!");
                        }else throw(err);
                    }
                }else{
                    if (err) throw (err);
                    else throw(res.data.error);
                }
            }catch(errText){                
                modal_dict.bodyText = errText;
                modal_dict.iconHeader = "red";
                setConfState();
            }
        }).catch(err=>{
            showBtnError(err);
        });
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
                            <div className="ui huge center aligned purple_header header">
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
                        <div className="ui tiny dead_center statistic" id="create_alias_div">
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
                            <div className="label initialcase extra content lineheight alot padding_x">
                                You can enter `tag` to add multiple addresses under same main alias.
                                When people send you TRX using just your alias, it will resolve to an empty
                                default tag if it's set.
                            </div>
                        </div>
                    </div>

                    <div className="ui centered card alot margined_t alias_round_tab_menu">
                        <div className="content">
                            <div className="ui top attached tabular two item menu no_border">
                                <div className="item active" data-tab="static"
                                    onClick={this.eventStaticMenuClick}>
                                    Static Address
                                </div>
                                <div className="item" data-tab="generate"
                                    onClick={this.eventGenerateMenuClick}>
                                    Generate Addresses on Fly
                                </div>
                            </div>
                            <div className="ui bottom attached tab segment very padded active menu_left_segment"
                                data-tab="static">
                                {this.createStaticAddressSegment()}
                            </div>
                            <div className="ui bottom attached tab very padded segment menu_right_segment"
                                data-tab="generate">
                                <GenerateAddressSegment updateGenAddrs={this.updateGenAddrs}/>
                            </div>
                        </div>
			        </div>

                    <div className="content dead_center padding">
                        <button className="ui purple_button button" onClick={e=>{this.eventCreateAliasClick(e)}}>
                            Create Alias
                        </button>
                    </div>
				</div>
                <ConfirmationModal id="create_alias_conf_modal" {...this.state.confModalProps}/>
			</div>
        );
    }
}

CreateAlias.defaultProps = {
    hideModal: (function(){})
}