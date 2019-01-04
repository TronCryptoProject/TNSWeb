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
            isfetch: false,
            currPage: 1,
            needToFetch: false
        };
        this.createActivityTable = this.createActivityTable.bind(this);
        this.createActivityRows = this.createActivityRows.bind(this);
        this.createPagination = this.createPagination.bind(this);
        this.eventCopyToClipboard = this.eventCopyToClipboard.bind(this);
        this.eventPageNumClick = this.eventPageNumClick.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.showDataState = this.showDataState.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.forceRefresh = this.forceRefresh.bind(this);
        this.itemsPerPage = 8;
        this.maxPages = 5;
    }

    componentDidMount(){
        this.fetchData();
        this.props.onRef(this);
    }
    componentWillUnmount(){
        this.props.onRef(null);
    }

    fetchData(callback){
        this.setState({isfetch: true});
        console.log("FETCHING");
        get(`activityApi/activity/${this.props.userAccount}`).then(res=>{
            let data = res.data;
            if ("error" in data){
                this.setState({error: data.error, isfetch: false},()=>{
                    if (callback) callback();
                });
            }else{
                this.setState({data: data.result, isfetch: false}, ()=>{
                    this.props.activityCounterCallback(this.state.data.length);
                    if (callback) callback();
                });
            }
        }).catch(err=>{
            console.log("my_activity_err", err);
            this.setState({error: "Network error", isfetch: false}, ()=>{
                if (callback) callback();
            });
        });
    }

    forceRefresh(e){
        e.persist();
       
        $(e.target).addClass("loading");
        this.fetchData(()=>{
            $(e.target).removeClass("loading")
        });
    }
    hideModal(e){
        this.setState({currPage:1});
        this.props.hideModal();
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

    eventPageNumClick(e, nextPage){
        this.setState({currPage:nextPage});
    }

    showDataState(text){
        let isloader = false;
        if (text == undefined || text == null || text == ""){
            isloader = true;
            text = "Fetching Data";
        }
        return(
            <div className={`ui padding compact raised dead_center segment auto_margin
                alias_loader_segment ` + (isloader?"loading":"")}>
                <div className="ui active dimmer dead_center">
                    <div className={"ui medium text"}>{text}</div>
                </div>
                <p></p>
                <p></p>
            </div>
        );
    }

    createPagination(){
        let num_items = this.state.data.length;
        let num_pages = Math.min(Math.ceil(num_items/this.itemsPerPage), this.maxPages);

        let res_pages = [];
        for (let page_idx = 0; page_idx < num_pages; page_idx++){
            let page_num = page_idx + 1;
            let is_active = this.state.currPage == page_num;
            res_pages.push(
                <a className={`item ${is_active?"active":""}`} key={`activity_page_${page_num}`}
                    onClick={e=>{this.eventPageNumClick(e, page_num)}}>
                    {page_num}
                </a>
            );
        }
        let pagination_class = res_pages.length > 0 ? "": "no_border";
        return(
            <div className={`ui pagination menu ${pagination_class}`}>
                {res_pages}
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
            for (let word_idx = 0; word_idx < str_split.length; word_idx++){
                let word = str_split[word_idx];
                if (word != ""){
                    if (word[0] == "{" && word[word.length-1] == "}"){
                        let content = word.format(entities) + " ";
                        let action_class = "activity_action";
                        if (word.includes("tagName") && entities["tagName"] == "default"){
                            action_class += " disabled_text";
                        }
                        res_list.push(
                            <span className={action_class} key={content + word_idx}>
                                {content}
                            </span>
                        );
                    }else{
                        res_list.push(<span key={word + word_idx}>{word + " "}</span>);
                    }
                }
            }
            return res_list;
        }

        let start_idx = (this.state.currPage - 1) * this.itemsPerPage;
        let end_idx = Math.min((start_idx + this.itemsPerPage), this.state.data.length);
        for (let row_num = start_idx; row_num < end_idx; row_num++){
            let data_row = this.state.data[row_num];
            let decrypted_entities = {};
            for (let entity in data_row.entities){
                try{
                    decrypted_entities[entity] = decryptData(data_row.entities[entity]);
                }catch(e){}
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
                            <th>
                                Activity
                            </th>
                            <th>
                                Timestamp
                            </th>
                            <th>
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
                            <button className="ui right floated icon circular button" onClick={e=>{this.hideModal(e)}}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="alot padding_x">
                        <div className="lineheight text_center activity_description">
                            You can monitor here whether your TNS transactions were successful or not. 
                        </div>
                        <div className="text_center lineheight disabled_text">
                            Reason 'REVERT' indicates failure to update contract due to user error. It may take
                            few minutes for the transaction to be confirmed and show up here.
                        </div>
                        <div className="dead_center margined_t">
                            <button className="ui right labeled icon button " onClick={e=>{this.forceRefresh(e)}}>
                                <i className="spinner icon"/>
                                Force Refresh
                            </button>
                        </div>
                    </div>

                    <div className="alot margined_y">
                        {this.createActivityTable()}
                    </div>
                    <div className="alot margined_b dead_center">
                        {this.createPagination()}
                    </div>
                </div>
            </div>
        );
    }
}

MyActivity.defaultProps = {
    hideModal: (function(){}),
    activityCounterCallback: (function(){}),
    userAccount: ""
}