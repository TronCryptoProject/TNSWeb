import React from "react";
import ConfirmationModal from "./ConfirmationModal.js";
import get from "axios";


export default class EditAliasModal extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            aliasInputVal: props.alias
        };
        this.eventSaveDataClick = this.eventSaveDataClick.bind(this);
    }

    componentWillReceiveProps(nextProps){
        this.setState({aliasInputVal: nextProps.alias});
    }

    eventSaveDataClick(e){
        e.persist();
        
        $(e.target).addClass("loading");

        let showBtnError = (errMsg)=>{
            $(e.target).removeClass("loading");
            let btn_conf_params =  {
                type: "error",
                error: {text: errMsg},
                normal: {text: "Broadcast Changes"}
            };
            if (errMsg.length > 24){
                btn_conf_params.duration = 2000;
            }
            $(e.target).showButtonConf(btn_conf_params);
        }
        let modal_dict = {
            icon: "list alternate outline",
            headerTitle: "Update Alias Transaction"
        }
        let setConfState = ()=>{
            this.setState({confModalProps: modal_dict}, ()=>{
                $(e.target).removeClass("loading");
                $("#edit_alias_conf_modal").modal({
                    closable: false,
                    onHidden: ()=>{
                        $("#alias_modal").modal("toggle");
                    }
                }).modal("show");
            });
        }

        let updateAlias = ()=>{
            let contract_params = [
                tronWeb.sha3(this.props.alias),
                window.hexToBytes32(encryptData(this.props.alias)),
                tronWeb.sha3(this.state.aliasInputVal),
                window.hexToBytes32(encryptData(this.state.aliasInputVal)),
            ];
            console.log("params: ", contract_params);
            window.contractSend("updateAlias", contract_params).then(res=>{
                console.log("updateAliasRes: ", res);
                modal_dict.bodyText = `Transaction for updating your alias to ${'"' + this.state.aliasInputVal +
                    '"'} successfully broadcasted. Hopefully someone else's transaction doesn't get that alias first.`;
                modal_dict.iconHeader = "green";
                setConfState();
            }).catch(err=>{
                console.log("updateAliasErr: ", err);
                modal_dict.bodyText = err;
                modal_dict.iconHeader = "red";
                setConfState();
            });
        }

        if (this.state.aliasInputVal == this.props.alias){
            showBtnError("You haven't changed your alias!");
        }else if (this.state.aliasInputVal == ""){
            showBtnError("Alias cannot be empty!");
        }else{
            try{
                get(`api/aliasAvailable/${this.state.aliasInputVal}`,{params:{raw:true}}).then(res=>{
                    if (res.data.result == false){
                        showBtnError("Alias is not available!");
                    }else{
                        updateAlias();
                    }
                }).catch(err=>{
                    throw err;
                });
            }catch(errText){
                modal_dict.bodyText = errText;
                modal_dict.iconHeader = "red";
                setConfState();
            }
        }
            
    }

    render(){
        let onChange=(e)=>{
            this.setState({aliasInputVal: $(e.target).val().trim()});
        }
        let onBlur = (e)=>{
            let val = $(e.target).val().trim();
            if (val == "")
                this.setState({aliasInputVal: this.props.alias});
        }

        return(
            <div className="ui modal tns_modal" id="alias_modal">
				<div className="ui blurring segment modal_layout_segment">
					<div className="ui centered three column grid row margined_b">
                        <div className="one wide column"></div>
                        <div className="fourteen wide column padding_y">
                            <div className="ui huge center aligned header no_user_select">
                                Edit Your Alias
                            </div>
                        </div>
                        <div className="one wide column">
                            <button className="ui right floated icon circular button" onClick={e=>{this.props.hideModal(e)}}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="alot padding_x">
                        <div className="fluid dead_center lineheight margined_y text_center container">
                            For security reasons, aliases can only be updated. You cannot delete it and all of its tags
                            at once.
                        </div>

                        <div className="alot margined_y">
                            <div className="ui tiny fullwidth statistic">
                                <div className="value">
                                    <div className="ui transparent large input">
                                        <input type="text" placeholder="Alias"
                                            className="text_center purple_input" autoComplete="off" spellCheck="false"
                                            id="edit_alias_input" value={this.state.aliasInputVal} onChange={e=>{onChange(e)}}
                                            onBlur={e=>{onBlur(e)}} maxLength="20"/>
                                    </div>
                                </div>
                                <div className="label initialcase">
                                    Alias
                                </div>
                            </div>
                        </div>
                       

                        <div className="content dead_center padding">
                            <button className="ui purple_button button" onClick={e=>{this.eventSaveDataClick(e)}}>
                                Broadcast Changes
                            </button>
                        </div>
                    </div>
                </div>
                <ConfirmationModal id="edit_alias_conf_modal" {...this.state.confModalProps}/>
            </div>
        );
    }
}

EditAliasModal.defaultProps = {
    hideModal: (function(){}),
    alias: ""
}