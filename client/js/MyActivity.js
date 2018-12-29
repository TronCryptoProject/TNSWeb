import React from "react";
import get from "axios";
import copy from 'copy-to-clipboard';
var format = require("string-format");
format.extend(String.prototype);

export default class MyActivity extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            data: [],
            error: "",
            isfetch: false
        };
        this.createActivityTable = this.createActivityTable.bind(this);
        this.createActivityRows = this.createActivityRows.bind(this);
        this.eventCopyToClipboard = this.eventCopyToClipboard.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.showDataState = this.showDataState.bind(this);
        this.interval = null;
    }

    componentDidMount(){
        this.fetchData();
        this.interval = setInterval(this.fetchData, 15000);
    }

    componentWillMount(){
        clearInterval(this.interval);
        this.interval = null;
    }

    fetchData(){
        this.setState({isfetch: true});
        get(`activityApi/activity/${tronWeb.defaultAddress.base58}`).then(res=>{
            let data = res.data;
            if ("error" in data){
                this.setState({error: data.error, isfetch: false});
            }else{
                this.setState({data: data.result, isfetch: false}, ()=>{
                    this.props.activityCounterCallback(this.state.data.length);
                });
            }
        }).catch(err=>{
            this.setState({error: err, isfetch: false});
        });
    }

    eventCopyToClipboard(e, data){
        e.persist();
        copy(data);
        let target = e.target;
        if ($(target).hasClass("hidden") || $(target).hasClass("visible")){
            target = $(target).parent();
        }
        $(target).addClass("green");
       
		setTimeout(()=>{
			$(target).removeClass("green");
		},300);
    }

    showDataState(text){
        let isloader = false;
        if (text == undefined || text == null || text == ""){
            isloader = true;
            text = "Fetching Data";
        }
        return(
            <div className="ui padding compact raised dead_center segment alias_loader_segment">
                <div className="ui active dimmer dead_center">
                    <div className={"ui medium text " + (isloader?"loader":"")}>{text}</div>
                </div>
                <p></p>
                <p></p>
            </div>
        );
    }

    createActivityRows(){
        let row_list = [];
        let getResultIcon = (result)=>{
            if (result.toLowerCase() == "success"){
                return <i className="circular inverted green check icon"/>;
            }else{
                return <i className="circular inverted red close icon"/>;
            }
        }
        let getHTMLActionStr = (baseStr, entities)=>{
            let str_split = baseStr.split(" ");
            let res_list = [];
            for (let word of str_split){
                if (word != ""){
                    if (word[0] == "{" && word[word.length-1] == "}"){
                        let content = word.format(entities) + " ";
                        let action_class = "activity_action";
                        if (word.includes("tagName") && entities["tagName"] == "default"){
                            action_class += " disabled_text";
                        }
                        res_list.push(
                            <span className={action_class} key={content}>
                                {content}
                            </span>
                        );
                    }else{
                        res_list.push(word + " ");
                    }
                }
            }
            return res_list;
        }

        for (let data_row of this.state.data){
            let decrypted_entities = {};
            for (let entity in data_row.entities){
                decrypted_entities[entity] = decryptData(data_row.entities[entity]);
            }
            row_list.push(
                <tr key={data_row.txid}>
                    <td>
                        {getResultIcon(data_row.result)}
                    </td>
                    <td>
                        <div className="ui one column paged stackable grid activity_grid">
                            <div className="row">
                                <p>
                                {getHTMLActionStr(data_row.action, decrypted_entities)}
                                </p>
                            </div>
                            <div className="row no_padding_t">
                                <div className="ui animated fade fluid compact mini button activity_txid_button"
                                    onClick={e=>{this.eventCopyToClipboard(e,data_row.txid)}}>
                                    <div className="visible content">{data_row.txid}</div>
                                    <div className="hidden content">
                                        copy
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="activity_timestamp">
                        {data_row.timestamp}
                    </td>
                    <td>
                        <div className="ui blue basic label activity_result_label">
                            {data_row.result}
                        </div>
                    </td>
                </tr>
            );
        }
        return row_list;
    }

    createActivityTable(){
        if (this.state.error != ""){
           return this.showDataState(this.state.error);
        }else if (this.state.data.length == 0 && this.state.isfetch == false){
            return this.showDataState("No transactions found");
        }else if (this.state.data.length == 0 && this.state.isfetch == true){
            return this.showDataState();
        }else{
            return(
                <table className="ui striped center aligned stackable tablet collapsing table"
                    id="activity_table">
                    <thead>
                        <tr className="center aligned">
                            <th className=""></th>
                            <th className="">
                                Activity
                            </th>
                            <th className="">
                                Timestamp
                            </th>
                            <th className="">
                                Reason
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.createActivityRows()}
                    </tbody>
                </table>
            );
        }
    }

    render(){
        return(
            <div className="ui modal tns_modal" id="my_activity_modal">
				<div className="ui blurring segment modal_layout_segment">
					<div className="ui centered three column grid row margined_b">
                        <div className="one wide column"></div>
                        <div className="fourteen wide column padding_y">
                            <div className="ui huge center aligned header purple_header no_user_select">
                                My TNS Transaction Activity
                            </div>
                        </div>
                        <div className="one wide column">
                            <button className="ui right floated icon circular button" onClick={e=>{this.props.hideModal(e)}}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="alot padding_x">
                        <div className="fluid dead_center lineheight margined_y text_center container activity_description">
                            You can monitor here whether your TNS transactions were successful or not. 
                        </div>
                    </div>
                    <div className="alot margined_y">
                        {this.createActivityTable()}
                    </div>
                </div>
            </div>
        );
    }
}

MyActivity.defaultProps = {
    hideModal: (function(){}),
    activityCounterCallback: (function(){})
}