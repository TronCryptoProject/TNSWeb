import React from "react";
import get from "axios";
import to from 'await-to-js';
import CreateAlias from "./CreateAlias.js";
import GenAddresses from "./GenAddresses.js";
import EditTagDataModal from "./EditTagDataModal.js";
import EditAliasModal from "./EditAliasModal.js";
import MyActivity from "./MyActivity.js";
import SecretUsers from "./SecretUsers.js";
import "./GlobalScope.js";
import io from 'socket.io-client';

export default class UserHome extends React.Component{
	constructor(props){
        super(props);
        this.state = {
            userAccount: window.tronWeb.defaultAddress.base58,
            data: {},
            showAliasLoader: true,
            genAddrModalProps: {},
            secretUsersModalProps:{},
            aliasEditModalProps: {},
            tagDataEditModalProps: {},
            currTxCount: localStorage.getItem("myActivityTXCount") || 0
        };
        this.fetchData = this.fetchData.bind(this);
        this.createAliasInfoCards = this.createAliasInfoCards.bind(this);
        this.eventCreateAliasClick = this.eventCreateAliasClick.bind(this);
        this.eventMyActivityClick = this.eventMyActivityClick.bind(this);
        this.hideCreateAliasCallback = this.hideCreateAliasCallback.bind(this);
        this.hideTagDataModalCallback = this.hideTagDataModalCallback.bind(this);
        this.hideAliasModalCallback = this.hideAliasModalCallback.bind(this);
        this.hideGenAddressCallback = this.hideGenAddressCallback.bind(this);
        this.hideMyActivityModalCallback = this.hideMyActivityModalCallback.bind(this);
        this.hideSecretUsersCallback = this.hideSecretUsersCallback.bind(this);
        this.createAliasRow = this.createAliasRow.bind(this);
        this.createAliasCard = this.createAliasCard.bind(this);
        this.createAliasLoader = this.createAliasLoader.bind(this);
        this.eventAliasGenAddressClick = this.eventAliasGenAddressClick.bind(this);
        this.eventAliasSecretUsersClick = this.eventAliasSecretUsersClick.bind(this);
        this.eventAliasEditClick = this.eventAliasEditClick.bind(this);
        this.eventTagDataEditClick = this.eventTagDataEditClick.bind(this);
        this.activityCounterCallback = this.activityCounterCallback.bind(this);
        this.handleSocketEvents = this.handleSocketEvents.bind(this);
        this.socket = null;
        this.myActivityRef = null;
    }

    componentDidMount(){
        this.fetchData(this.props, true);
        let modal_ids = ["#create_alias_modal", "#alias_gen_addresses_modal",
            "#alias_modal", "#tag_data_modal", "#my_activity_modal","#secret_users_modal"];
        for (let id of modal_ids){
            let background_class = (id == "#my_activity_modal")?"activity_background": "create_alias_background";
            $(id).modal({
                blurring: true,
                allowMultiple: true,
                closable: false,
                transition: "slide up",
                duration: 100,
                onShow: () =>{
                    $(id).parent().addClass(background_class);
                    $(id).parent().addClass("overflow_hidden");
                    if (id == "#my_activity_modal"){
                        localStorage.setItem("myActivityTXCount", this.state.currTxCount);
                        this.forceUpdate();
                    }
                },
                onHidden:()=>{
                    $(id).parent().removeClass(background_class);
                    $(id).parent().removeClass("overflow_hidden");
                }
            });
        }
        this.handleSocketEvents();
    }

    handleSocketEvents(){
        this.socket = io("http://localhost:8888");
        this.socket.on("connect", ()=>{
            console.log("connected");
            this.socket.emit("watchMe", tronWeb.defaultAddress.base58);
        });
        this.socket.on("gotMail", ()=>{
            console.log("got mail emit received");
            this.fetchData(this.props);
            if (this.myActivityRef != null){
                this.myActivityRef.fetchData();
            }
        });
    }

    componentWillUnmount(){
        $("#main_background_div").removeClass("userhome_full_background");
        if (this.socket != null){
            this.socket.close();
            this.socket = null;
        }
        this.myActivityRef = null;
    }

    async fetchData(props, showLoader){
        if (showLoader == undefined || showLoader == null) showLoader = false;

        if (showLoader){
            this.setState({showAliasLoader: true});
        }
        
        let [err, response] = await to(get(`api/allAliasInfo/${this.state.userAccount}`));
        if (!err){
            let data = response.data;
            console.log(data.result);
           
            this.setState({data: data.result, showAliasLoader: false}, ()=>{
                if (Object.keys(this.state.data).length > 0){
                    $("#main_background_div").addClass("userhome_full_background");
                }else{
                    $("#main_background_div").removeClass("userhome_full_background");
                }

                $(".alias_table thead>tr th").popup({
                    boundary: ".alias_segment",
                    transition: "vertical flip",
                    position: "top center",
                    lastResort: 'top center',
                    onShow: function(){
                        resizePopup();
                    }
                });
            });
            
        }else{
            console.log("error: ", err);
        }
    }

    eventCreateAliasClick(){
        $("#create_alias_modal").modal("show");
    }

    eventMyActivityClick(){
        $("#my_activity_modal").modal("show");
    }

    hideSecretUsersCallback(){
        $("#secret_users_modal").modal("hide");
    }
    hideCreateAliasCallback(){
        $("#create_alias_modal").modal("hide");
    }
    hideAliasModalCallback(){
        $("#alias_modal").modal("hide");
    }
    hideTagDataModalCallback(){
        $("#tag_data_modal").modal("hide");
    }
    hideGenAddressCallback(){
        $("#alias_gen_addresses_modal").modal("hide");
        let tmp_dict = Object.assign(this.state.genAddrModalProps, {isOpen:false});
        this.setState({genAddrModalProps: tmp_dict});
    }
    hideMyActivityModalCallback(){
        $("#my_activity_modal").modal("hide");
    }

    activityCounterCallback(newTxCount){
        this.setState({currTxCount: newTxCount}, ()=>{
            if ($("#notif_badge").length > 0){
                $("#notif_badge").animateCss("zoomIn");
            }
        });
    }

    eventAliasGenAddressClick(e,alias, tag, tagData){
        let tmp_dict = {
            alias: decryptData(alias),
            tag: decryptData(tag),
            pubAddress: tagData.tagPubAddress,
            genList: tagData.genAddressList,
            isOpen: true
        };
        tmp_dict = Object.assign(this.state.genAddrModalProps, tmp_dict);
        this.setState({genAddrModalProps: tmp_dict}, ()=>{
            $("#alias_gen_addresses_modal").modal("show");
        });
    }

    eventAliasSecretUsersClick(e, alias, tag, tagData){
        let tmp_dict = {
            alias: decryptData(alias),
            tag: decryptData(tag),
            usersList: tagData.secretMembers
        };
        tmp_dict = Object.assign(this.state.secretUsersModalProps, tmp_dict);
        this.setState({secretUsersModalProps: tmp_dict}, ()=>{
            $("#secret_users_modal").modal("show");
        });
    }

    eventAliasEditClick(e, alias){
        let tmp_dict = Object.assign(this.state.aliasEditModalProps, {
            alias: decryptData(alias)
        });
        this.setState({aliasEditModalProps: tmp_dict}, ()=>{
            $("#alias_modal").modal("show");
        });
    }

    eventTagDataEditClick(e, alias, tag, tagData){
        console.log("rawtag:", tag, "END");
        console.log("TAGEDIT:", decryptData(tag), "END");

        let all_tags = [];
        for(let tag in this.state.data[alias]){
            all_tags.push(decryptData(tag));
        }
        let mod_dict = {
            alias: decryptData(alias),
            tag: decryptData(tag),
            allTags: all_tags,
            ttlGenAddrs: tagData.genAddressList.length,
            data: {
                pubAddress: tagData.tagPubAddress,
                permissionConfig: (tagData.isSecret? "secret": "public"),
                addressConfig: (tagData.generatorFlag? "auto-gen": "static")
            }
        };
        let tmp_dict = Object.assign(this.state.tagDataEditModalProps, mod_dict);
        this.setState({tagDataEditModalProps: tmp_dict}, ()=>{
            $("#tag_data_modal").modal("show");
        });
    }

    createAliasLoader(){
        if (this.state.showAliasLoader){
            return(
                <div className="ui padding compact raised segment alias_loader_segment">
                    <div className="ui active dimmer">
                        <div className="ui medium text loader">Fetching Data </div>
                    </div>
                    <p></p>
                    <p></p>
                </div>
            );
        }
    }
    createAliasCard(alias, rowList){
        return(
            <div className="ui padding compact raised segment alias_segment" key={alias} id={alias}>
                <div className="ui text_center big fluid label ui huge header purple_header">
                    {decryptData(alias)}
                    <i className="ui red edit icon alias_edit_icon" onClick={e=>{this.eventAliasEditClick(e, alias)}}/>
                </div>
                <table className="ui striped single line table alias_table">
                    <thead>
                        <tr className="center aligned">
                            <th data-content={`Tag for your alias with current active configuration.
                                An empty tag is a default tag for current alias, which means an alias without
                                a tag will always resolve to it.`}
                                className="four wide">
                                Tag
                            </th>
                            <th data-content={`Static address always resolve to the same
                                address for your alias`}
                                className="five wide">
                                Static Address
                            </th>
                            <th data-content={`List of addresses that are auto generated. 
                                Only this option or static address can be active at one time.`}
                                className="three wide">
                                Auto-Gen Address
                            </th>
                            <th data-content={`List of addresses that can view your alias/tag, otherwise
                                it's public to everyone`} className="three wide">
                                Secret Members
                            </th>
                            <th className=""></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowList}
                    </tbody>
                </table>
            </div>
            
        );
    }

    createAliasRow(alias, tag, tag_data){
        let decrypted_tag = decryptData(tag);
        let getStaticAddress = ()=>{
            let pub_addr = tag_data.tagPubAddress;            
            if (isZeroAddress(pub_addr)) return <div className="disabled_text">Not set</div>;
            else return <div>{base58(pub_addr)}</div>;
            
        }
        let getAutoGenAddresses = ()=>{
            if ("genAddressList" in tag_data){
                return(
                    <button className="ui button"
                        onClick={e=>{this.eventAliasGenAddressClick(e,alias,tag,tag_data)}}>
                        {tag_data.genAddressList.length} addresses
                    </button>
                );
            }else{
                return(
                    <button className="ui disabled button">
                        unavailable
                    </button>
                );
            }
        }
        let getPermissions = ()=>{
            let secret_mem_num = tag_data.secretMembers.length % 2 == 0 ? tag_data.secretMembers.length/2:0;
            if ("secretMembers" in tag_data){
                return(
                    <button className="ui button"
                        onClick={e=>{this.eventAliasSecretUsersClick(e,alias,tag,tag_data)}}>
                        {secret_mem_num} addresses
                    </button>
                );
            }else{
                return(
                    <button className="ui disabled button">
                        unavailable
                    </button>
                );
            }
        }

        return(
            <tr key={[alias,tag].join("_")}>
                <td>
                    <div className="ui grid">
                        <div className="one column centered row">
                            <div className={`column center aligned ui medium header ` + 
                                (decrypted_tag=="default"? "none_display":"")}>
                                {decrypted_tag}
                            </div>
                        </div>
                        <div className="two column row no_padding_t">
                            <div className="column right aligned">
                                <div className="ui tiny orange center aligned label tag_config_label">
                                    {tag_data.isSecret? "secret": "public"}
                                </div>
                            </div>
                            <div className="column left aligned">
                                <div className="ui tiny pink center aligned label tag_config_label">
                                    {tag_data.generatorFlag? "auto-gen": "static"}
                                </div>
                            </div>
                        </div>

                    </div>
                </td>
                <td className="center aligned">
                    {getStaticAddress()}
                </td>
                <td className="center aligned">
                    {getAutoGenAddresses()}
                </td>
                <td className="center aligned">
                    {getPermissions()}
                </td>
                <td className="center aligned">
                    <i className="ui red edit icon tag_edit_icon"
                        onClick={e=>{this.eventTagDataEditClick(e, alias, tag, tag_data)}}/>
                </td>
            </tr>
        );
    }

    createAliasInfoCards(){
        let num_alias = Object.keys(this.state.data).length;
        if (num_alias > 0){
            let alias_list = [];
            for (let alias in this.state.data){
                let row_list = [];
                let sort_tag = [];
                for(let tag in this.state.data[alias]){
                    sort_tag.push([decryptData(tag), tag]);
                }
       
                sort_tag.sort(function(a,b){
                    let a_tag = a[0] == "default" ? "": a[0];
                    let b_tag = b[0] == "default" ? "": b[0];
                    if (a_tag == b_tag) return 0;
                    return a_tag < b_tag ? -1:1;
                });
      
                for(let [_,tag] of sort_tag){
                    let tag_data = this.state.data[alias][tag];
                    row_list.push(this.createAliasRow(alias,tag,tag_data));
                }
                alias_list.push(this.createAliasCard(alias, row_list));
            }
            return alias_list;
        }
    }

    render(){
        let getMyActivityNotifBadge = ()=>{
            let storage_tx_count = localStorage.getItem("myActivityTXCount");
            let countdiff = this.state.currTxCount - storage_tx_count;
            if (countdiff > 0){
                return <div className="floating ui red circular small label" id="notif_badge">{countdiff}</div>;
            }
        }

        return(
            <div>
                <div className="ui alot padding text container">
                    <div className="ui inverted tiny dead_center statistic" id="default_address">
                        <div className="value initialcase">
                            {this.state.userAccount}
                        </div>
                        <div className="label initialcase">
                            Current User Account
                        </div>
                    </div>
                </div>
                <div className="dead_center container alot margined_b">
                    <div className="ui buttons" id="userhome_main_buttons">
                        <button className="ui large purple_button labeled icon button" onClick={this.eventCreateAliasClick}>
                            <i className="plus square icon"/>
                            Create Alias
                        </button>
                        <div className="activity_badge_div">
                            <button className="ui large purple_button right labeled icon button" onClick={this.eventMyActivityClick}>
                                <i className="list alternate icon"/>
                                My Activity
                            </button>
                            {getMyActivityNotifBadge()}
                        </div>
                    </div>
                </div>
                <div className="ui center aligned inverted large header no_user_select">
                    {Object.keys(this.state.data).length} aliases found for current account
                    <div className="sub header disabled_text">
                        {Object.keys(this.state.data).length > 0? "Hover over each column to learn more": ""}
                    </div>
                </div>
                
                <div className="ui one column centered grid">
                    {this.createAliasLoader()}
                    {this.createAliasInfoCards()}
                </div>
                <CreateAlias hideModal={this.hideCreateAliasCallback}/>
                <GenAddresses hideModal={this.hideGenAddressCallback} {...this.state.genAddrModalProps}/>
                <SecretUsers hideModal={this.hideSecretUsersCallback} {...this.state.secretUsersModalProps}/>
                <EditTagDataModal hideModal={this.hideTagDataModalCallback} {...this.state.tagDataEditModalProps}/>
                <EditAliasModal hideModal={this.hideAliasModalCallback} 
                    {...this.state.aliasEditModalProps}/>
                <MyActivity hideModal={this.hideMyActivityModalCallback}
                    activityCounterCallback={this.activityCounterCallback}
                    onRef={ref=>(this.myActivityRef = ref)}/>
            </div>            
        );
    }
}

UserHome.defaultProps = {

}