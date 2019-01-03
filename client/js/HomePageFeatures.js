import React from "react";

export default class HomePageFeatures extends React.Component{
    constructor(props){
        super(props);
        this.getFeaturesDiv = this.getFeaturesDiv.bind(this);
		this.getProtectionDiv = this.getProtectionDiv.bind(this);
		this.getApplicationsDiv = this.getApplicationsDiv.bind(this);
        this.getFooterDiv = this.getFooterDiv.bind(this);
        
        this.eventGithubClick = this.eventGithubClick.bind(this);
    }

    eventGithubClick(){
        window.open("https://gitlab.com/gregorydev/tnsweb", "_blank");
    }

    getFeaturesDiv(){
		return(
			<div className="ui stackable grid" id="home_features_grid">
				<div className="left middle aligned two column row">
					<div className="left floated center aligned column">
                        <video className="tns_resolver_video border_radius_1em" autoPlay="autoplay" loop muted>
                            <source src="images/tns_resolver.mp4" type="video/mp4" />
                        </video>
					</div>
					<div className="right floated column">
						<div className="ui huge center aligned margined_b header">
							Chat-like Usernames for Tron Addresses
						</div>
						<p>
							You’ll never have to worry about entering a wrong
							address when sending TRX. It’s visually easier to look
							at a username you cann understand than a long alphanumeric string.
							More than 90% of people are anxious about sending crypto to
							the wrong person.
						</p>
					</div>
				</div>
				<div className="center middle aligned two column row">
					<div className="left floated column">
						<div className="ui huge center aligned margined_y header">
							Create Multiple Tags under Same Alias
						</div>
						<p>
							You can create tags for specific purposes without having 
							to create new aliases for each Tron public address. This
							makes it easier for you to categorize and better manage your
							transactions
						</p>
					</div>
					<div className="right floated center aligned column">
						<div className="ui center aligned segment" id="home_features_alias_seg">
                            <div className="ui one column centered grid container">
                                <div className="row">
                                    <div className="ui inverted olive small statistic">
                                        <div className="value">
                                            Justin
                                        </div>
                                        <div className="label">
                                            for general purpose
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="ui inverted orange small statistic">
                                        <div className="value">
                                            Justin{" {"}business{"}"}
                                        </div>
                                        <div className="label">
                                            for business transactions
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="ui inverted yellow small statistic">
                                        <div className="value">
                                            Justin{" {"}friends{"}"}
                                        </div>
                                        <div className="label">
                                            for friends {" / "} family
                                        </div>
                                    </div>
                                </div>
                            </div>
						</div>
					</div>
				</div>
                <div className="left middle aligned two column row">
					<div className="left floated center aligned column">
                        <object type="image/svg+xml" data="../images/rotating_address_anim.svg"></object>
					</div>
					<div className="right floated column">
						<div className="ui huge center aligned margined_y header">
							Have Transactions Sent to New Addresses
						</div>
						<p>
                            You can have your incoming transactions be sent to new addresses
                            every time your alias is resolved by TNS! This lets you mask your identity for every transaction
                            by creating multiple addresses under 1 mnemonic HD key,
                            so that every transaction is sent to a different address.
                            You should keep your wealth private without having to manage several private keys.
						</p>
                        <p className="extra content">
                            Addresses will be reused in round-robin fashion if they grow to be too large.
                        </p>
					</div>
				</div>
				<div className="one column middle aligned centered row" id="home_page_feature_cards">
                    <div className="column">
                        <div className="ui four stackable cards">
                            <div className="ui raised centered card">
                                <div className="padding image">
                                    <img src="../images/decentralized_anim.svg"/>
                                </div>
                                <div className="content">
                                    <div className="center aligned header">
                                        Truly Decentralized 
                                    </div>
                                    <div className="center aligned description">
                                        Name Service System is completely decentralized running
                                        on Tron Smart Contracts, and cannot be manipulated by
                                        anyone.
                                    </div>
                                </div>
                            </div>

                            <div className="ui raised centered card">
                                <div className="padding image">
                                    <img src="../images/unlocked_anim.svg"/>
                                </div>
                                <div className="content">
                                    <div className="center aligned header">
                                        Control Permissions on Alias
                                    </div>
                                    <div className="center aligned description">
                                        You can choose to make your alias public or secret so that
                                        it's only visible to selected number of people/addresses.
                                        You have full control over how you use your alias!
                                    </div>
                                </div>
                            </div>

                             <div className="ui raised centered card">
                                <div className="padding image">
                                    <img src="../images/zero_anim.svg"/>
                                </div>
                                <div className="content">
                                    <div className="center aligned header">
                                        No Gas Paid by Sender
                                    </div>
                                    <div className="center aligned description">
                                        Address lookup by alias is free so that the sender can send
                                        transaction without paying extra cost. The name service system was
                                        designed to minimize gas cost, so not even the contract itself pays
                                        for the user.
                                    </div>
                                </div>
                            </div>

                            <div className="ui raised centered card">
                                <div className="padding image">
                                    <img src="../images/api_anim.svg"/>
                                </div>
                                <div className="content">
                                    <div className="center aligned header">
                                        HTTP API Integration
                                    </div>
                                    <div className="center aligned description">
                                        Any wallet or party can freely use our HTTP API service to resolve
                                        aliases for addresses. For more details check out our API documentation.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                    
				</div>
			</div>
		);
	}

	getProtectionDiv(){
		return(
			<div>
				<div className="ui huge center aligned padding_y header">Protection Against Abuse and Fraud</div>
				<div className="ui raised compact segments" id="home_page_protection_seg">
					<div className="ui very padded yellow segment">
                        <div className="ui two column stackable centered grid">
                            <div className="three wide center middle aligned column">
                                <object type="image/svg+xml" data="../images/secret_anim.svg"/>
                            </div>
                            <div className="twelve wide column">
                                <div className="ui large header">
                                    Obfuscated Aliases & Confidentiality
                                </div>
                                <div className="content">
                                    Aliases are stored in contracts as keccak256 so that others can’t fish, spoof or
                                    squat similar aliases as yours. This prevents people from accessing
                                    random aliases & its corresponding addresses, helping us mitigate attacks and
                                    protect your identity.
                                </div>
                                <div className="extra content">
                                    Only you (owner) can decrypt human readable aliases with your password
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ui very padded orange segment">
                        <div className="ui two column stackable centered grid">
                            <div className="three wide center middle aligned column">
                                <img src="../images/non-reverse.svg"/>
                            </div>
                            <div className="twelve wide column">
                                <div className="ui large header">
                                    Non-Reversibility of Aliases to Addresses
                                </div>
                                <div className="content">
                                    TNS gives you protection from reverse lookup for aliases.
                                    One cannot fetch all aliases connecting to a Tron public address.
                                    You can only fetch the public address of an alias if the person requesting
                                    knows about your human readable alias. This help makes the system identity-safe
                                    and keeps user’s data hidden.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ui very padded red segment">
                        <div className="ui two column stackable centered grid">
                            <div className="three wide center middle aligned column">
                                <img src="../images/hacker.png"/>
                            </div>
                            <div className="twelve wide column">
                                <div className="ui large header">
                                    Resistent to Homoglyph Attacks
                                </div>
                                <div className="content">
                                    Aliases are strictly limited to alphanumeric characters
                                    (including underscore) so that attackers cannot set aliases
                                    with characters that appear identical or very similar to yours on the
                                    screen. 
                                </div>
                            </div>
                        </div>
                    </div>
				</div>
			</div>
		);
	}

	getApplicationsDiv(){
		return(
			<div>
                <div className="ui huge center aligned padding_y blue header">Applications of TNS</div>
                <div className="text_center" id="home_applications_desc">
                    Tron Name Service can extend beyond your wallet, so users, developers,
                    merchants and exchanges can benefit from easy of use, transparency and
                    reliability of Tron ecosystem.
                </div>
				<div className="one column middle aligned centered grid" id="home_application_cards">
                    <div className="column">
                        <div className="ui three stackable dead_center cards">
                            <div className="ui raised centered card">
                                <div className="content">
                                    <div className="ui large center aligned green header">
                                        Wallets
                                    </div>
                                    <div className="center aligned description">
                                        Provides a friendly way for users to send crypto using usernames. 
                                        When alias in entered, an API request is sent to get its corresponding
                                        address, to which the transaction is sent behind the scenes.
                                    </div>
                                </div>
                            </div>

                            <div className="ui raised centered card">
                                <div className="content">
                                    <div className="ui large center aligned green header">
                                        Contract Addresses
                                    </div>
                                    <div className="center aligned description">
                                        DApp developers don’t have to change existing contract addresses
                                        in their code everytime they modify & deploy new contracts.
                                        Contract alias will always point to the most current & correct
                                        contract address!
                                    </div>
                                </div>
                            </div>
                            
                            <div className="ui raised centered card">
                                <div className="content">
                                    <div className="ui large center aligned green header">
                                        Exchanges
                                    </div>
                                    <div className="center aligned description">
                                        Exchanges can also call our API when their users
                                        are sending TRX to others who have set aliases.
                                        They can even run their own API for more trust since the base
                                        contract functionalities remain the same.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
			</div>
		);
	}

	getFooterDiv(){
		return(
			<div className="ui basic center aligned segment">
				<div className="ui labeled icon red button" onClick={this.eventGithubClick}>
                    <i className="github icon"></i>
                    Github Code
				</div>
			</div>
		)
    }
    
    render(){
        return(
            <div>
                <section className="alot padding" id="home_features_section">
                    {this.getFeaturesDiv()}
                </section>
                <section className="alot padding dead_center" id="home_protection_section">
                    {this.getProtectionDiv()}
                </section>
                <section className="alot padding" id="home_application_section">
                    {this.getApplicationsDiv()}
                </section>
                <section className="alot padding" id="home_footer_section">
                    {this.getFooterDiv()}
                </section>
            </div>
        );
    }
}
