import React from "react";
import ConfirmationModal from "./ConfirmationModal.js";
import axios from "axios";
const CancelToken = axios.CancelToken;

export default class LiveDemo extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isRawTxTab: false,
            ConfModalProps: {},
            tns:{
                unsigned:{
                    isValueResolved: false,
                    isResolveError: false,
                    resolvedValueStr: "",
                    isLoading: false
                },
                signed:{
                    isValueResolved: false,
                    isResolveError: false,
                    resolvedValueStr: "",
                    isLoading: false,
                },
                cardSideActive: ""
            }
        }
        this.tabChanged = this.tabChanged.bind(this);
        this.renderSignedTxCard = this.renderSignedTxCard.bind(this);
        this.eventAddressOnChange = this.eventAddressOnChange.bind(this);
        this.eventAddressInputBlur = this.eventAddressInputBlur.bind(this);
        this.eventAmtChanged = this.eventAmtChanged.bind(this);
        this.eventTxSend = this.eventTxSend.bind(this);
        this.getTxBuilderConfTable = this.getTxBuilderConfTable.bind(this);
        this.resetTNSResolverStates = this.resetTNSResolverStates.bind(this);
        this.getCurrentSide = this.getCurrentSide.bind(this);
        this.requestToken = null;
    }

    componentDidMount(){
        $("#live_demo_shape").shape();
    }

    getTxBuilderConfTable(args){
        return(
            <table className="ui very basic selectable inverted table" id="live_demo_conf_table">
                <tbody>
                    <tr>
                        <td>From</td>
                        <td className="twelve wide">{args.from}</td>
                    </tr>
                    <tr>
                        <td>To</td>
                        <td className="twelve wide">{args.to}</td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td className="twelve wide">{args.amount}</td>
                    </tr>
                    <tr>
                        <td>Transaction ID</td>
                        <td className="twelve wide">{args.txid}</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    getCurrentSide(){
        return (this.state.isRawTxTab ? "unsigned": "signed");
    }

    tabChanged(){
        this.setState({
            isRawTxTab: !this.state.isRawTxTab
        }, ()=>{
            if (this.state.isRawTxTab){
                $("#live_demo_shape").shape("flip back");
            }else{
                $("#live_demo_shape").shape("flip over");
            }
        });
    }

    resetTNSResolverStates(){
        let current_side = this.getCurrentSide();
        let tns_dict = Object.assign(this.state.tns, {
            [current_side]: {
                isValueResolved:false,
                resolvedValueStr: "",
                isResolveError: false,
                isLoading: false,
                cardSideActive: ""
            }
        });
        this.setState({tns:tns_dict});
    }

    eventAddressOnChange(e){
        let val = $(e.target).val().trim();
        val = val.replace(/[^a-zA-Z0-9_{}]/g, "");
        $(e.target).val(val);

        if (this.state.tns[this.getCurrentSide()].isLoading){
            console.log("canceling");
            if (this.requestToken != null){
                this.requestToken.cancel();
                this.requestToken = null;
            }
            this.resetTNSResolverStates();
        }
    }

    eventAddressInputBlur(e){ 
        let current_side = this.getCurrentSide();
        if (this.state.tns[current_side].isLoading && this.requestToken != null){
            return;
        }
        
        let val = $(e.target).val().trim();
        let resetResolvedStates = ()=>{
            setTimeout(()=>{
                this.resetTNSResolverStates();
            }, 1500);
        }
       
        let showState = (msg,isError)=>{
            if (isError == undefined || isError == null) isError = true;
            let tns_dict = Object.assign(this.state.tns, {
                [current_side]: {
                    resolvedValueStr: msg,
                    isResolveError: isError,
                    isValueResolved: true,
                    isLoading: false,
                    cardSideActive: current_side
                }
            });
            this.setState({tns:tns_dict}, ()=>{
                $("#tns_resolve_div>.ui.label").animateCss("zoomIn");
                if(isError) resetResolvedStates();
            });
        }
        let checkifTRXAddress = (callback)=>{
            if (window.tronWeb.isAddress(val)){
                if (val[0] == "T"){
                    showState(val,false);
                }else{
                    showState("Hex addresses are not allowed");
                }
            }else{
                if (callback) callback();
            }
        }

        if (val != ""){
            this.requestToken = axios.CancelToken.source();
            let tmp_side_card_dict = Object.assign(this.state.tns[current_side], {isLoading: true});
            let tmp_dict = Object.assign(this.state.tns, {[current_side]:tmp_side_card_dict});
            this.setState({tns:tmp_dict});

            let alias_tag_match = val.match(/^([\w_]+)\{([\w_]+)\}$/);
            let alias_match = val.match(/^[\w_]+$/);
            if (alias_tag_match || alias_match){
                let alias = "";
                let tag = "default";
                if (alias_tag_match){
                    if (alias_tag_match[1] && alias_tag_match[2]){
                        alias = alias_tag_match[1].toLowerCase();
                        tag = alias_tag_match[2].toLowerCase();
                    }else{
                        showState("Unable to parse alias/tag");
                        return;
                    }
                }else if (alias_match){
                    alias = alias_match[0].toLowerCase();
                }
                
                checkifTRXAddress(()=>{
                    axios.get(`api/resolveAlias/${alias}/${tag}`,{
                        params:{raw:true},
                        cancelToken: this.requestToken.token
                    }).then(res=>{
                        if ("result" in res.data){
                            var resolved_address = res.data.result;
                            if (resolved_address != ""){
                                showState(base58(resolved_address),false)
                            }else{
                                showState("no alias/tag found");
                            }
                        }else if ("error" in res.data){
                            showState(`Error: ${res.data.error}`);
                        }
                    }).catch(e=>{
                        console.log("resolved err:",e);
                        if (axios.isCancel(e)){
                            this.resetTNSResolverStates();
                        }else{
                            showState("Network Error");
                        }
                    })
                });
            }else{
                showState("Invalid Address or Alias");
            }
        }else{
            if (this.state.tns[current_side].isValueResolved){
                this.resetTNSResolverStates();
            }
        }
    }

    eventAmtChanged(e){
        let target_id = e.target;
		let val = $(target_id).val().trim();
		let num = Number(val);
		if (isNaN(num) || num < 0){
			$(target_id).val("0");
		}
    }
    
    eventTxSend(e, txState){
        e.persist();
        let current_side = this.getCurrentSide();
        let to = $("#to_input_" + txState).val().trim();
        let amt = $("#amt_input_" + txState).val().trim();

        if (this.state.tns[current_side].isValueResolved && !this.state.tns[current_side].isResolveError){
            to = this.state.tns[current_side].resolvedValueStr.trim();
        }

        if (to != "" && (amt != "" || amt != "0")){
            $(e.target).addClass("loading");
            let modal_dict = {
                icon: "circular exchange",
                headerTitle: "Transaction Status"
            }

            let setConfState = ()=>{
                this.setState({ConfModalProps: modal_dict}, ()=>{
                    $(e.target).removeClass("loading");
                    $("#live_demo_conf_modal").modal({
                        closable: false
                    }).modal("show");
                });
            }

            if (txState == "signed"){
                window.tronWeb.trx.sendTransaction(to, amt).then(res=>{
                    modal_dict.bodyText = "Transaction successfully sent!"
                    modal_dict.iconHeader = "green";
                    setConfState();
                }).catch(err=>{
                    modal_dict.bodyText = JSON.stringify(err);
                    modal_dict.iconHeader = "red";
                    setConfState();
                });
            }else{
                window.tronWeb.transactionBuilder.sendTrx(to, amt).then(res=>{
                    let contractargs = res.raw_data.contract[0].parameter.value;
                    let args = {
                        from: window.tronWeb.address.fromHex(contractargs.owner_address),
                        to: tronWeb.address.fromHex(contractargs.to_address),
                        amount: contractargs.amount,
                        txid: res.txID
                    }
                    modal_dict.bodyText = this.getTxBuilderConfTable(args);
                    modal_dict.iconHeader = "green";
                    setConfState();
                }).catch(err=>{
                    modal_dict.bodyText = JSON.stringify(err);
                    modal_dict.iconHeader = "red";
                    setConfState();
                });
            }
        }else{  
            let button_conf_dict = {
                type: "error",
                error: {
                    text: "Input is empty"
                },
                normal: {
                    text: (txState == "signed"? "Send Transaction" : "Build Transaction"),
                    icon: "bullhorn"
                }
            };
            $(e.target).showButtonConf(button_conf_dict);
        }
    }

    renderSignedTxCard(txState){
        let getTitle = ()=>{
            if (txState == "signed"){
                return(
                    <h2 className="ui header">
                        Send Transaction using TronLink
                        <div className="ui disabled sub header initialcase">
                            You'll be asked by TronLink to sign & broadcast transaction
                        </div>
                    </h2>
                );
            }else{
                return(
                    <h2 className="ui header">
                        Create Unsigned Transaction
                        <div className="ui disabled sub header initialcase">
                            You'll have to sign & broadcast transaction by yourself
                        </div>
                    </h2>
                );
            }
        }

        let getResolvedAddress = ()=>{
            let current_side = this.getCurrentSide();
            if (txState == this.state.tns[current_side].cardSideActive){
                if (this.state.tns[current_side].isLoading){
                    return(
                       
                            <i className="spinner small orange loading icon"></i>
                       
                    );
                }
                if (this.state.tns[current_side].isValueResolved){
                    let class_resolved = "resolved_value ";
                    class_resolved += this.state.tns[current_side].isResolveError ? "red": "resolved_value_success";
    
                    return(
                       
                            <div className={`ui small label ${class_resolved}`}>
                                {this.state.tns[current_side].resolvedValueStr}
                            </div>

                    )
                }
            }
        }

        let to_input_id = "to_input_" + txState;
        let amount_id = "amt_input_" + txState;

        return(
            <div className="ui one column centered padded grid">
                {getTitle()}

                <div className="no_padding fullwidth row_spaced_div">
                    <div className="row no_margined_t">
                        <div className="ui tiny statistic fullwidth">
                            <div className="value" id="tns_resolve_div">
                                {getResolvedAddress()}
                            </div>
                            <div className="value">
                                <div className="ui transparent small input">
                                    <input type="text" placeholder="Recipient alias or address" id={to_input_id}
                                        className="text_center" autoComplete="off" spellCheck="false"
                                        onBlur={e=>{this.eventAddressInputBlur(e)}}
                                        onChange={e=>{this.eventAddressOnChange(e)}}/>
                                </div>
                            </div>
                            <div className="label">
                                To
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="ui small statistic fullwidth">
                            <div className="value">
                                <div className="ui transparent input">
                                    <input type="number" placeholder="0" min="0" onChange={(e)=>{this.eventAmtChanged(e)}}
                                        id={amount_id} className="text_center" autoComplete="off"
                                        spellCheck="false"/>
                                </div>
                            </div>
                            <div className="label">
                                Amount (TRX)
                            </div>
                        </div>
                    </div>
                </div>
                

                <div className="row">
                    <button className={`ui right labeled icon button ` + 
                        (txState == "signed"? "green" : "orange")} onClick={(e)=>{this.eventTxSend(e, txState)}}
                        id={txState + "_send_button"}>
                        <i className="bullhorn icon"/>
                        {txState == "signed"? "Send Transaction" : "Build Transaction"}
                    </button>
                </div>
            </div>
        );
    }


    render(){
        return(
            <div>
                <div className="CheckboxAnim_main_div">
                    <input className="Checkbox__default Checkbox_override" id="livedemo_checkbox" type="checkbox" checked={this.state.isRawTxTab}
                        onChange={this.tabChanged} />
                    <label className="Checkbox" htmlFor="livedemo_checkbox">
                        <div className="Checkbox__trigger" data-value="Send TRX"></div>
                        <div className="Checkbox__trigger" data-value="Unsigned TX"></div>
                    </label>
                </div>
                <div className="ui people shape dead_center text container" id="live_demo_shape">
                    <div className="sides" id="live_demo_sides">
                        <div className="side active" id="signed_tx_card">
                            <div className="ui fluid raised card">
                                {this.renderSignedTxCard("signed")}
                            </div>
                        </div>
                        <div className="side" id="unsigned_tx_card">
                            <div className="ui fluid raised card">
                                {this.renderSignedTxCard("unsigned")}
                            </div>
                        </div>
                    </div>
                </div>
                <ConfirmationModal id="live_demo_conf_modal" {...this.state.ConfModalProps}/>
            </div>
        );
    }
}