import React from "react";
import Equal from "deep-equal";
import get from "axios";

export default class GenAddresses extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            genList: this.parseGenList(props.genList),
            alias: decryptData(props.alias),
            trxPrice: 0
        };
        this.createGenAddrTable = this.createGenAddrTable.bind(this);
        this.createGenAddrRows = this.createGenAddrRows.bind(this);
        this.getAccountBalances = this.getAccountBalances.bind(this);
        this.parseGenList = this.parseGenList.bind(this);
        this.fetchTrxPrice = this.fetchTrxPrice.bind(this);
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
			tmp_dict.alias = decryptData(nextProps.alias);
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
                $("#gen_" + account).text(tronWeb.fromSun(sunBalance));
            }).catch(err=>{console.log(err)});
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
                        {idx}
                    </td>
                    <td className="center aligned">
                        {addr}
                    </td>
                    <td className="center aligned">
                        {getPriceStatistic(addr)}
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
                            <button className="ui right floated icon circular button" onClick={e=>{this.props.hideModal(e)}}>
                                <i className="close icon"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="alot padding_x">
                        <div className="fluid dead_center lineheight margined_y text_center container">
                            A new address is chosen everytime someone wants to send you
                            TRX in order to keep your wealth personal. Addresses are reused
                            once all of them are used at least once. In order to edit addresses,
                            please close this modal and turn on edit mode for this alias.
                        </div>
                        <div className="fluid dead_center disabled_text container">
                            Only the alias owner can retrieve generated address.
                        </div>

                        <div className="alot margined_y">
                            {this.createGenAddrTable()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

GenAddresses.defaultProps = {
    hideModal: (function(){}),
    isEdit: false,
    alias: "",
    genList:[], 
    isOpen: false
}