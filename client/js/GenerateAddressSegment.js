import React from "react";
import bip39 from "bip39";
import bip32 from "bip32";
import TronWeb from "tronweb";
import FileSaver from "file-saver";

export default class GenerateAddressSegment extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            currPage: "home",
            genAddrs:[],
            genMN: [],
            isGenerated: false,
            importMNState: "editable"
        };
        this.getAddrs = this.getAddrs.bind(this);
        this.createMainOption = this.createMainOption.bind(this);
        this.createNewWallet = this.createNewWallet.bind(this);
        this.eventImportWalletClick = this.eventImportWalletClick.bind(this);
        this.eventCreateWalletClick = this.eventCreateWalletClick.bind(this);
        this.eventCloseGenWalletSegment = this.eventCloseGenWalletSegment.bind(this);
        this.generateNewWallet = this.generateNewWallet.bind(this);
        this.createLabeledMnemonic = this.createLabeledMnemonic.bind(this);
        this.eventGenAddressClick = this.eventGenAddressClick.bind(this);
        this.eventGenAddressDownloadClick = this.eventGenAddressDownloadClick.bind(this);
        this.eventImportMNOnChange = this.eventImportMNOnChange.bind(this);
        this.eventImportMNClick = this.eventImportMNClick.bind(this);
        this.eventImportMNInputBlur = this.eventImportMNInputBlur.bind(this);
    }

    componentDidUpdate(){
        $("#gen_address_cnt").dropdown();
    }

    eventImportMNOnChange(e){
        let val = $(e.target).val();
        val = val.replace(/[^a-zA-Z ]/g, "");
        $(e.target).val(val);
    }

    eventImportMNClick(e){
        this.setState({importMNState: "editable"}, ()=>{
            $("#import_wallet_input_div>input").focus();
        });
    }

    eventImportMNInputBlur(e){
        let val = $(e.target).val().trim();
        let split_val = val.split(" ");
        let res_val = [];

        for (let idx = 0; idx < split_val.length; idx++){
            let tmp_val = split_val[idx].trim();
            if (tmp_val != ""){
                res_val.push(tmp_val);
            }
        }
        this.setState({importMNState: "uneditable", genMN: res_val});
    }

    eventCloseGenWalletSegment(){
        this.setState({
            currPage: "home",
            isGenerated: false,
            genMN:[],
            genAddrs:[],
            importMNState: "editable"
        }, ()=>{
            this.props.updateGenAddrs(this.state.genAddrs);
        });
    }

    eventCreateWalletClick(e){
        this.setState({currPage: "createWallet",genMN: this.generateNewWallet()});
    }

    eventImportWalletClick(e){
        this.setState({currPage: "importWallet"});
    }

    getAddrs(){
        let res_list = [];
        for (let key of this.state.genAddrs){
            res_list.push(TronWeb.address.toHex(TronWeb.address.fromPrivateKey(key)));
        }
        return res_list;
    }

    eventGenAddressDownloadClick(e){
        let file_list = [];
        let pub_addrs = this.getAddrs();
        for(let idx = 0; idx < this.state.genAddrs.length; idx++){
            let pkey = this.state.genAddrs[idx];
            file_list.push(`ACCOUNT INDEX: ${idx}\n`);
            file_list.push(`Public Address: ${TronWeb.address.fromHex(pub_addrs[idx])}\n`);
            file_list.push(`Public Address (HEX): ${pub_addrs[idx]}\n`);
            file_list.push(`Private Key: ${pkey}\n`);
            file_list.push("\n\n");
        }
        file_list.pop();
        let blob = new Blob(file_list, {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, `GeneratedAddresses(${this.state.genAddrs.length})-${tronWeb.defaultAddress.base58}`);
    }

    eventGenAddressClick(e){
        e.persist();
        if (this.state.genMN.length == 12){
            let count = $("#gen_address_cnt").dropdown("get value");

            if (count == undefined || count == ""){
                let button_conf_dict = {
                    type: "error",
                    error: {
                        text: "Please specify address count"
                    },
                    normal: {
                        text: "Generate Addresses"
                    }
                };
                $(e.target).showButtonConf(button_conf_dict);
            }else{
                $(e.target).addClass("loading");
                setTimeout(()=>{
                    let addr_list = [];
                    let seed = bip39.mnemonicToSeed(this.state.genMN.join(" "));
                    let node = bip32.fromSeed(seed);
                    for (let x = 0; x < count; x++){
                        let child = node.derivePath(`m/44'/195'/${ x }'/0/0`);
                        let pkey = child.privateKey.toString('hex');
                        addr_list.push(pkey);
                    }
                    $(e.target).removeClass("loading");
                    this.setState({
                        genAddrs: addr_list,
                        isGenerated: true
                    }, ()=>{
                        this.props.updateGenAddrs(this.getAddrs());
                    });
                },1000);
            }
        }else{
            let button_conf_dict = {
                type: "error",
                error: {text: "Mnemonic cannot be empty"},
                normal: {text: "Generate Addresses"}
            };
            if (this.state.genMN.length != 0){
                button_conf_dict.error.text = "Mnemonic is not valid";
            }
            $(e.target).showButtonConf(button_conf_dict);
        }
    }

    generateNewWallet(){
        let mnemonic = bip39.generateMnemonic(128);
        return mnemonic.split(" ");
    }

    createLabeledMnemonic(){
        let genLabels = ()=>{
            let res_list = [];
            let row_num = 3;
            let col_len = 12/row_num;
            for (let row = 0; row < 3; row++){
                let start_idx = (row * col_len);
                let res_row_list = [];
                for (let idx = start_idx; idx < (start_idx + col_len); idx++){
                    let word = " ";
                    if (idx < this.state.genMN.length){
                        word = this.state.genMN[idx];
                    }
                    res_row_list.push(
                        <div className="column overflow_hidden" key={"mnemonic_col_" + idx}>
                            <div className="flex_display dead_center">
                                <div className="mnemonic_detail">{idx+1}</div>
                                <div className="ui label center aligned mnemonic">
                                    {word}
                                </div>
                            </div>
                        </div>
                    );
                }
                res_list.push(
                    <div className={row > 0 ? "no_padding_t row": "row"} key={"mnemonic_row_" + row}>
                        {res_row_list}
                    </div>
                );
            }
            return res_list;
        }

        return(
            <div className="ui four column stackable doubling grid container">
                {genLabels()}
            </div>
        );
    }

    createNewWallet(genState){
        let getGenButtons = ()=>{
            if (this.state.isGenerated){
                return(
                    <button className="ui margined_y right green labelled button" onClick={e=>{this.eventGenAddressDownloadClick(e)}}>
                       <i className="download icon"/>
                       Download Addresses
                    </button>
                );
            }else{
                return(
                    <button className="ui margined_y button" onClick={e=>{this.eventGenAddressClick(e)}}>
                        Generate Addresses
                    </button>
                );
            }
        }
        
        let getHeader = ()=>{
            if (genState == "import"){
                return(
                    <div className="ui center aligned header">
                        Import Your Mnemonic Key
                    </div>
                );
            }else{
                return(
                    <div className="ui center aligned header">
                        Your Mnemonic Key
                        <div className="ui sub header">
                            Please save this key. You'll not be shown it again.
                        </div>
                    </div>
                );
            }
        }

        let getParsedMnemonicSegment = ()=>{
            if (genState == "import" && this.state.importMNState == "editable"){
                return(
                    <div className="ui fluid input" id="import_wallet_input_div">
                        <input type="text" placeholder="Paste your mnemonic key separated by space"
                            onChange={e=>{this.eventImportMNOnChange(e)}}
                            onBlur={e=>{this.eventImportMNInputBlur(e)}}
                            defaultValue={this.state.genMN.join(" ")}/>
                    </div>
                );
            }else{
                let click_func = (function(){});
                if (genState == "import"){
                    click_func = this.eventImportMNClick;
                }
                return(
                    <div className="ui basic segment new_wallet_segment"
                        onClick={e=>{click_func(e)}}>
                        {this.createLabeledMnemonic()}
                    </div>
                );
            }
        }

        return(
            <div>
                {getHeader()}
                {getParsedMnemonicSegment()}
                <div className="ui center aligned alot margined_t header">
                    How many Addresses to Create?
                </div>
                <div className="text_center lineheight description">
                    Addresses under your HD wallet will start with account index 0
                    and go to however many addresses you choose to generate. You may 
                    choose to download locally the generated addresses for your convenience.
                </div>
                <div className="container dead_center">
                    <div className="ui selection center aligned dropdown" id="gen_address_cnt">
                        <input type="hidden" name="count"/>
                        <i className="dropdown icon"></i>
                        <div className="default text">Count</div>
                        <div className="menu">
                            <div className="text_center item">5</div>
                            <div className="text_center item">10</div>
                            <div className="text_center item">15</div>
                            <div className="text_center item">20</div>
                        </div>
                    </div>
                </div>
                <div className="dead_center margined_t container">
                    {getGenButtons()}
                </div>
                
            </div>
        );
    }

    createMainOption(){
        return(
            <div className="ui two column stackable center aligned grid">
                <div className="ui vertical divider">Or</div>
                <div className="middle aligned row">
                    <div className="column">
                        <div className="ui mud_green_color icon header block_display">
                            <i className="download icon"/>
                            Import HD Wallet
                        </div>
                        <button className="ui button" onClick={e=>{this.eventImportWalletClick(e)}}>
                            Import
                        </button>
                    </div>
                    <div className="column">
                        <div className="ui mud_green_color icon header block_display">
                            <i className="address card icon"/>
                            Create New HD Wallet
                        </div>
                        <button className="ui button" onClick={e=>{this.eventCreateWalletClick(e)}}>
                            Create
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    render(){
        let getPage = ()=>{
            if (this.state.currPage == "home"){
                return this.createMainOption();
            }
            let ext_div;
            if (this.state.currPage == "createWallet"){
                ext_div = this.createNewWallet("new");
            }else if (this.state.currPage == "importWallet"){
                ext_div =  this.createNewWallet("import");
            }
            return(
                <div>
                    <div className="flowroot_display">
                        <button className="ui right floated icon circular button" onClick={this.eventCloseGenWalletSegment}>
                            <i className="close icon"/>
                        </button>
                    </div>
                    {ext_div}
                </div>
            );
        }
        return(
            <div>
                <div className="text_center lineheight description">
                    With this option, whenever someone uses your alias to send you money,
                    it will always resolve to different addresses from your HD wallet. This helps
                    you keep your crypto in multiple wallets to obsecure your wealth in cases such 
                    as Tron business accounts. 
                </div>
                <div className="text_center lineheight description">
                    An HD wallet creates all private/public keys under 1 mnemonic key starting
                    with account index 0, so that you can create any number of accounts without
                    having to manage multiple private keys. 
                </div>
                <div className="ui placeholder segment" id="generate_wallet_segment">
                    {getPage()}
                </div>
            </div>
        );
    }
}

GenerateAddressSegment.defaultProps = {
    updateGenAddrs: (function(){})
}