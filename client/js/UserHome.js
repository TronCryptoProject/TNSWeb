import React from "react";
import get from "axios";
import to from 'await-to-js';
import CreateAlias from "./CreateAlias.js";
import "./GlobalScope.js";


export default class UserHome extends React.Component{
	constructor(props){
        super(props);
        this.state = {
            userAccount: window.tronWeb.defaultAddress.base58,
            data: {}
        };
        this.fetchData = this.fetchData.bind(this);
        this.createAliasInfoCards = this.createAliasInfoCards.bind(this);
        this.eventCreateAlias = this.eventCreateAlias.bind(this);
        this.hideCreateAliasCallback = this.hideCreateAliasCallback.bind(this);
        this.createAliasRow = this.createAliasRow.bind(this);
        this.createAliasCard = this.createAliasCard.bind(this);
    }

    componentDidMount(){
        this.fetchData(this.props);
        $("#create_alias_modal").modal({
            blurring: true,
            allowMultiple: true,
            closable: false,
            transition: "slide up",
            duration: 100,
            onShow: () =>{
                $("#create_alias_modal").parent().addClass("create_alias_background");
                $("#create_alias_modal").parent().addClass("overflow_hidden");
            },
            onHidden:()=>{
                $("#create_alias_modal").parent().removeClass("create_alias_background");
                $("#create_alias_modal").parent().removeClass("overflow_hidden");
            }
        });
    }
    
    async fetchData(props){
        let [err, response] = await to(get(`api/allAliasInfo/${this.state.userAccount}`));
        if (!err){
            let data = response.data;
            console.log(data.result);
            this.setState({data: data.result}, ()=>{
                if (Object.keys(this.state.data).length > 0){
                    $("#main_background_div").css("height", "auto");
                }else{
                    $("#main_background_div").css("height", "100vh");
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

    eventCreateAlias(){
        $("#create_alias_modal").modal("show");
    }

    hideCreateAliasCallback(){
        $("#create_alias_modal").modal("hide");
    }

    createAliasCard(alias, rowList){
        return(
            <div className="ui padding compact raised segment alias_segment" key={alias}>
                <div className="ui text_center big fluid label ui huge header">
                    {decryptData(alias)}
                </div>
                <table className="ui striped table alias_table">
                    <thead>
                        <tr className="center aligned">
                            <th data-content={`Tag for your alias with current active configuration.
                                An empty tag is a default tag for current alias`}>
                                Tag
                            </th>
                            <th data-content={`Static address always resolve to the same
                                address for your alias`}>
                                Static Address
                            </th>
                            <th data-content={`List of addresses that are auto generated. 
                                Only this option or static address can be active at one time.`}>
                                Auto-Generated Address
                            </th>
                            <th data-content={`List of addresses that can view your alias/tag, otherwise
                                it's public to everyone`}>
                                Secret Members
                            </th>
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
        let getStaticAddress = ()=>{
            let pub_addr = tag_data.tagPubAddress;
            if (isZeroAddress(pub_addr)){
                return(
                    <div className="disabled_text">Not set</div>
                );
            }else{
                return(
                    <div>{base58(pub_addr)}</div>
                )
            }
        }
        let getAutoGenAddresses = ()=>{
            if ("genAddressList" in tag_data && tag_data.genAddressList.length > 0){
                return(
                    <button className="ui button">
                        {tag_data.genAddressList.length} addresses
                    </button>
                );
            }else{
                return(
                    <button className="ui disabled button">
                        0 addresses
                    </button>
                );
            }
        }
        let getPermissions = ()=>{
            if ("secretMembers" in tag_data){
                return(
                    <button className="ui button">
                        {tag_data.secretMembers.length} addresses
                    </button>
                );
            }else{
                return(
                    <button className="ui disabled button">
                        0 members
                    </button>
                );
            }
        }
        let decrypted_tag = decryptData(tag);

        return(
            <tr key={[alias,tag].join("_")}>
                <td>
                    <div className="ui grid">
                        <div className="one column row">
                            <div className={`column center aligned ui medium header ` + 
                                (decrypted_tag=="default"? "none_display":"")}>
                                {decrypted_tag}
                            </div>
                        </div>
                        <div className="two column row no_padding_t">
                            <div className="column right aligned">
                                <div className="ui tiny orange label">
                                    {"permission" in tag_data? tag_data.permission: "public"}
                                </div>
                            </div>
                            <div className="column left aligned">
                                <div className="ui tiny pink label">
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
            </tr>
        );
    }

    createAliasInfoCards(){
        let num_alias = Object.keys(this.state.data).length;
        if (num_alias > 0){
            let alias_list = [];
            for (let alias in this.state.data){
                let row_list = [];
                for(let tag in this.state.data[alias]){
                    let tag_data = this.state.data[alias][tag];
                    row_list.push(this.createAliasRow(alias,tag,tag_data));
                }
                console.log(row_list);
                alias_list.push(this.createAliasCard(alias, row_list));
            }
            console.log(alias_list);
            return alias_list;
        }
    }

    render(){
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
                <div className="dead_center container">
                    <div className="ui buttons">
                        <button className="ui large purple_button button" onClick={this.eventCreateAlias}>Create Alias</button>
                    </div>
                </div>
                <div className="ui center aligned inverted large header no_user_select">
                    {Object.keys(this.state.data).length} aliases found for current account
                </div>
                <div className="ui one column centered grid">
                    {this.createAliasInfoCards()}
                </div>
                <CreateAlias hideModal={this.hideCreateAliasCallback}/>
            </div>            
        );
    }
}

UserHome.defaultProps = {

}