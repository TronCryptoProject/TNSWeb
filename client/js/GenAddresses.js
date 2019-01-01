import React from "react";
import Equal from "deep-equal";
import get from "axios";
import ConfirmationModal from "./ConfirmationModal.js";

export default class GenAddresses extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            genList: this.parseGenList(props.genList),
            alias: props.alias,
            props: props.tag,
            trxPrice: 0,
            toShowGenSegment: false,
            genAddrInputVal: "",
            confModalProps: {}
        };
        this.createGenAddrTable = this.createGenAddrTable.bind(this);
        this.createGenAddrRows = this.createGenAddrRows.bind(this);
        this.createAddGenAddrSegment = this.createAddGenAddrSegment.bind(this);
        this.eventAddGenAddrSegShowClick = this.eventAddGenAddrSegShowClick.bind(this);
        this.eventAddGenAddrClick = this.eventAddGenAddrClick.bind(this);
        this.eventDeleteGenAddressClick = this.eventDeleteGenAddressClick.bind(this);
        this.showButtonError = this.showButtonError.bind(this);
        this.getAccountBalances = this.getAccountBalances.bind(this);
        this.parseGenList = this.parseGenList.bind(this);
        this.fetchTrxPrice = this.fetchTrxPrice.bind(this);
        this.showConfModal = this.showConfModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.trxPriceInterval = null;
    }

    componentDidMount(){
        this.getAccountBalances(this.state.genList);
    }

    componentWillReceiveProps(nextProps){
        let tmp_dict = {};
		if (!Equal(nextProps.genList, this.props.genList)){
            tmp_dict.genList = this.parseGenList(nextProps.genList);
		}
		if (!Equal(nextProps.alias, this.props.alias)){
			tmp_dict.alias = nextProps.alias;
        }
        if (!Equal(nextProps.tag, this.props.tag)){
			tmp_dict.tag = nextProps.tag;
        }
        tmp_dict = Object.assign(this.state, tmp_dict);
		if (Object.keys(tmp_dict).length != 0){
            this.setState(tmp_dict, ()=>{
                if ("genList" in tmp_dict){
                    this.getAccountBalances(tmp_dict.genList);
                }
            });
        }
        if (nextProps.isOpen && this.trxPriceInterval == null){
            this.fetchTrxPrice();
            this.trxPriceInterval = setInterval(this.fetchTrxPrice, 10000);
        }else if (!nextProps.isOpen && this.trxPriceInterval != null){
            clearInterval(this.trxPriceInterval);
            this.trxPriceInterval = null;
        }
    }

    hideModal(e){
        this.setState({toShowGenSegment: false});
        this.props.hideModal();
    }

    fetchTrxPrice(){
        get("https://api.coinmarketcap.com/v1/ticker/tron/").then(res=>{
            let price = res.data[0].price_usd;
            if (price == undefined){
                price = 0;
            }
            this.setState({trxPrice: Number(price)});
        }).catch(err=>{
            console.log(err);
        })
    }

    parseGenList(genList){
        let res_list = [];
        for (let addr of genList){
            res_list.push(base58(addr));
        }
        return res_list;
    }

    getAccountBalances(genList){
        for (let account of genList){
            tronWeb.trx.getBalance(account).then(sunBalance=>{
                let trx_balance = tronWeb.fromSun(sunBalance);
                let balance = Math.round(trx_balance * 100) / 100;
                $("#gen_" + account).text(balance);
            }).catch(err=>{console.log(err)});
        }
    }

    showButtonError(errMsg, target){
        let btn_conf_params =  {
            type: "error",
            error: {text: errMsg},
            normal: {text: "Broadcast Append Address"}
        };
        if (errMsg.length > 24){
            btn_conf_params.duration = 2000;
        }
        $(target).showButtonConf(btn_conf_params);
    }

    eventAddGenAddrSegShowClick(e){
        let setState = ()=>{
            this.setState({toShowGenSegment: !this.state.toShowGenSegment}, ()=>{
                if (this.state.toShowGenSegment){
                    $("#gen_addr_segment").animateCss("flipInX");
                }
            });
        }
        if ((!this.state.toShowGenSegment) == false){
            $("#gen_addr_segment").animateCss("flipOutX", ()=>{
                setState();
            });
        }else{
            setState();
        }
        
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
            let is_called = false;
            $("#gen_addr_conf_modal").modal({
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
                    $("#alias_gen_addresses_modal").modal("toggle");
                }
            }).modal("show")
        });
    }

    eventAddGenAddrClick(e){
        console.log("genaddr:",this.state.genAddrInputVal);
        if (!tronWeb.isAddress(this.state.genAddrInputVal)){
            this.showButtonError("Address is not valid", e.target);
            return;
        }
        let parseAddr = (addr)=>{
            if (addr == "T") return tronWeb.address.toHex(addr);
            return addr;
        }
        let getBase58Addr = (addr)=>{
            if (addr != "T") return base58(addr);
            return addr;
        }

        let is_default = this.state.tag == "default";

        let conf_text_suffix = `${is_default ? "default tag": "{" + this.state.tag +"} tag"} for '${this.state.alias}' alias`;
        let modal_dict = {
            icon: "plus square outline",
            headerTitle: "Append Address to Auto-Gen for Tag",
            bodyText: `Are you sure you want to append address ${getBase58Addr(this.state.genAddrInputVal)} for ${conf_text_suffix}?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        this.showConfModal(modal_dict, ()=>{
            return {
                method: "updateGenAddressListAppend",
                params:[
                    tronWeb.sha3(this.state.alias),
                    tronWeb.sha3(this.state.tag),
                    parseAddr(this.state.genAddrInputVal)
                ],
                conf:{
                    headerTitle: "Status for Append Address to Auto-Gen",
                    bodyText: `Transaction successfully broadcasted to append address ${getBase58Addr(this.state.genAddrInputVal)}. Please monitor the transaction
                    to see if contract update was successful.`
                }
            };
        });

    }

    eventDeleteGenAddressClick(e,idx){
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
                $("#gen_addr_conf_modal").modal({
                    onHidden: ()=>{
                        $("#alias_gen_addresses_modal").modal("toggle");
                    }
                }).modal("show");
            })
        }      

        if (this.state.genList == 1 && isZeroAddress(this.props.pubAddress)){
            showConfMsg("You are deleting the last auto-generated address, however, static address is not set. Please set static address before deleting this last auto-gen address, so your alias/tag will automatically resolve to it. Only either static address or auto-gen option can be on at any given time.");
            return;
        }

        let is_default = this.state.tag == "default";

        let conf_text_suffix = `${is_default ? "default tag": "{" + this.state.tag +"} tag"} for '${this.state.alias}' alias`;
        let modal_dict = {
            icon: "trash alternate",
            headerTitle: "Delete Auto-Gen Address for Tag",
            bodyText: `Are you sure you want to delete address ${this.state.genList[idx]} for ${conf_text_suffix}?`,
            iconHeader: "orange",
            actions: ["ok", "cancel"],
            actionsText: ["Yes I do", "Cancel"]
        }

        this.showConfModal(modal_dict, ()=>{
            return {
                method: "updateGenAddressListDelete",
                params:[
                    tronWeb.sha3(this.state.alias),
                    tronWeb.sha3(this.state.tag),
                    idx
                ],
                conf:{
                    headerTitle: "Status for Delete Auto-Generated Address",
                    bodyText: `Transaction successfully broadcasted to delete address ${this.state.genList[idx]}. Please monitor the transaction
                    to see if contract update was successful.`
                }
            };
        });
    }

    createAddGenAddrSegment(){
        let onChange=(e)=>{
            let val = $(e.target).val().trim();
            val = val.replace(/[^a-zA-Z0-9_]/g, "");
            this.setState({genAddrInputVal: val});
        }

        if (this.state.toShowGenSegment){
            return(
                <div className="one column row">
                    <div className="ui padded green center aligned raised segment border_radius_1em" id="gen_addr_segment">
                        <div className="margined_b">
                            You can append new addresses to already created auto-generated address list.
                        </div>
                        <div className="ui mini fullwidth statistic">
                            <div className="value">
                                <div className="ui transparent small input">
                                    <input type="text" placeholder="Public Address"
                                        className="text_center purple_input" autoComplete="off" spellCheck="false"
                                        id="gen_addr_append_input" value={this.state.genAddrInputVal} onChange={e=>onChange(e)}
                                        maxLength="34"/>
                                </div>
                            </div>
                            <div className="label initialcase padding_t">
                                Public Address
                            </div>
                        </div>
                        <button className="ui green center aligned button margined_t" onClick={e=>{this.eventAddGenAddrClick(e)}}>
                            Broadcast Append Address
                        </button>
                    </div>
                </div>
            );
        }
    }
    createGenAddrRows(){
        let getTrxPrice = (address)=>{
            let trx = Number($("#gen_" + address).text().trim());
            return Math.round((trx * this.state.trxPrice) * 100) / 100;
        }
        let getPriceStatistic = (addr)=>{
            let price = getTrxPrice(addr);
            let label_class = "label " + (this.state.trxPrice == 0? "none_display": "");
            return(
                <div className="ui mini green statistic">
                    <div className="value" id={["gen",addr].join("_")}></div>
                    <div className={label_class}>{`${price} USD`}</div>
                </div>
            );
        }
        let row_list = [];
        for(let idx = 0; idx < this.state.genList.length; idx++){
            let addr = this.state.genList[idx];
          
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
                        {getPriceStatistic(addr)}
                    </td>
                    <td className="center aligned">
                        <i className="ui red trash large alternate icon gen_delete_icon" onClick={e=>{this.eventDeleteGenAddressClick(e,idx)}}/>
                    </td>
                </tr>
            );
        }
        return row_list;
    }

    createGenAddrTable(){
        return(
            <table className="ui striped table">
                <thead>
                    <tr className="center aligned">
                        <th></th>
                        <th>Public Address</th>
                        <th>Balance</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {this.createGenAddrRows()}
                </tbody>
            </table>
        );
    }

    render(){
        return(
            <div className="ui modal tns_modal" id="alias_gen_addresses_modal">
				<div className="ui blurring segment modal_layout_segment">
					<div className="ui centered three column grid row margined_b">
                        <div className="one wide column"></div>
                        <div className="fourteen wide column padding_y">
                            <div className="ui huge center aligned purple_header header">
                                Auto-Generated Addresses
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
                    
                    <div className="padding_x" id="gen_address_edit_main_div">
                        <div className="fluid dead_center lineheight margined_y text_center container">
                            A new address is chosen everytime someone wants to send you
                            TRX in order to keep your wealth personal. Addresses are reused
                            once all of them are used at least once. In order to edit addresses,
                            please close this modal and turn on edit mode for this alias.
                        </div>
                        <div className="fluid dead_center disabled_text container">
                            Only the alias owner can retrieve generated address.
                        </div>

                        <div className="margined_y ui centered grid">
                            <div className="one column row">
                                <button className="ui purple_button center aligned right labeled icon button"
                                    onClick={e=>{this.eventAddGenAddrSegShowClick(e)}}>
                                    <i className="plus square icon"/>
                                    Append Generated Address
                                </button>
                            </div>
                            {this.createAddGenAddrSegment()}
                        </div>
                        <div className="alot margined_y">
                            {this.createGenAddrTable()}
                        </div>
                    </div>
                </div>
                <ConfirmationModal id="gen_addr_conf_modal" {...this.state.confModalProps}/>
            </div>
        );
    }
}

GenAddresses.defaultProps = {
    hideModal: (function(){}),
    isEdit: false,
    alias: "",
    tag: "",
    pubAddress: "",
    genList:[], 
    isOpen: false
}