import React from "react";
import ConfirmationModal from "./ConfirmationModal.js";

export default class LiveDemo extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isRawTxTab: false,
            ConfModalProps: {}
        }
        this.tabChanged = this.tabChanged.bind(this);
        this.renderSignedTxCard = this.renderSignedTxCard.bind(this);
        this.eventToInputChanged = this.eventToInputChanged.bind(this);
        this.eventAmtChanged = this.eventAmtChanged.bind(this);
        this.eventTxSend = this.eventTxSend.bind(this);
        this.getTxBuilderConfTable = this.getTxBuilderConfTable.bind(this);
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

    eventToInputChanged(e){
        let val = $(e.target).val().trim();
        if (val != ""){
            if (window.tronWeb.isAddress(val)){
                //$("#to_input_suffix").text("");
            }else{
                //$("#to_input_suffix").text("@TRX");
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

        let to = $("#to_input_" + txState).val().trim();
        let amt = $("#amt_input_" + txState).val().trim();

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
                    modal_dict.bodyText = err;
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
                    modal_dict.bodyText = err;
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

        let to_input_id = "to_input_" + txState;
        let amount_id = "amt_input_" + txState;

        return(
            <div className="ui one column centered padded grid">
                {getTitle()}

                <div className="no_padding fullwidth row_spaced_div">
                    <div className="row">
                        <div className="ui tiny statistic fullwidth">
                            <div className="value">
                                <div className="ui transparent small input">
                                    <input type="text" placeholder="Recipient alias or address"
                                        onChange={e=>{this.eventToInputChanged(e)}} id={to_input_id}
                                        className="text_center" autoComplete="off" spellCheck="false"/>
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