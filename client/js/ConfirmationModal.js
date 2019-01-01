import React from "react";

export default class ConfirmationModal extends React.Component{
    constructor(props){
        super(props);
        this.state = {};
        this.getActions = this.getActions.bind(this);
    }

    getActions(){
        let res_list = [];
        for(let i = 0; i < this.props.actions.length; i++){
            let action = this.props.actions[i];
            let key = "conf_modal_";
            let actiontext = this.props.actionsText[i];

            if (action == "ok"){
                res_list.push(
                    <div className="ui green ok inverted button" key={key + actiontext}>
                        <i className="checkmark icon"/>
                        {actiontext}
                    </div>
                );
            }else if (action == "cancel"){
                res_list.push(
                    <div className="ui red basic cancel inverted button" key={key + actiontext}>
                        <i className="remove icon"/>
                        {actiontext}
                    </div>
                );
            }
        }
        return res_list;
    }

    render(){
        let getBody = ()=>{
            if (typeof this.props.bodyText == "object"){
                return this.props.bodyText;
            }else{
                return <p className="alot-lineheight">{this.props.bodyText}</p>;
            }
        }

        return(
            <div className={"ui modal " + this.props.modalType} id={this.props.id}>
                <div className={"ui icon huge header " + this.props.iconHeader}>
                    <i className={"icon " + this.props.icon}/>
                    {this.props.headerTitle}
                </div>
                <div className="content dead_center text_center large_text">
                    {getBody()}
                </div>
                <div className="actions">
                    {this.getActions()}
                </div>
            </div>
        );
    }
}

ConfirmationModal.defaultProps = {
    modalType: "basic",
    icon: "",
    iconHeader: "",
    headerTitle: "",
    bodyText: "",
    actions: ["ok"],
    actionsText: ["Okay"],
    id: "conf_modal"
}