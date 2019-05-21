# Tron Name Service Dapp
#### Web Interface/API for setting human readable usernames for base58 Tron addresses

#### View demo website/API here: [TronDapp](https://troncryptoproject.github.io/TNSWeb/)
#### Video walk-through demo: https://vimeo.com/337208830
<br/>
<img src="https://media.giphy.com/media/J5Lg2zmuJKSH6AJcQy/giphy.gif" width="698"/>


### API
<img src="https://i.imgur.com/1IlX9s3.png" width="700"/>

### Features
- [x] Create chat-like usernames for any Tron public address: You’ll never have to worry that you have the address wrong, and it’s visually easier to look at than a long alphanumeric string.
- [x] Create tags under same alias for a person without having to create new aliases for each Tron address:
  * For example, you can create JustinSun{business} for business transactions and JustinSun{friends} when you would like to have friends send you money.
- [x] No gas is paid by the sender:
  - Address lookup by alias is free so that the sender can send transaction without paying extra cost.
- [x] Completely Decentralized Name System
- [x] Super easy HTTP API integration: Any wallet can call our HTTP API to retrieve an address for an alias.
- [x] Permission levels on aliases (secret, public)
- [x] Mask Identity for every transaction with rotating addresses: Create multiple addresses with 1 mnemonic HD key so that every transaction is sent to a different address. This helps keep your wealth private without having to manage multiple private keys.

### Protection Against Abuse and Fraud
- [x] Obfuscated aliases & Confidentiality: aliases are stored as keccak256 so that others can’t fish, spoof or squat on aliases. This prevents people from accessing random aliases & its corresponding addresses to eliminate attacks
    - only you (owner) can retrieve human readable aliases
- [x] Non-Reversibility: Protection from reverse lookup for aliases. One cannot fetch all aliases connecting to a Tron public address. You can only fetch the public address of an alias if the person requesting knows about your human readable alias. This help makes the system identity-safe and keeps user’s data hidden.
- [x] Resistent to homoglyph attacks: aliases are strictly limited to alphanumeric characters (including underscore) so that attackers cannot set aliases with characters that appear identical or very similar on screen. 


### Applications of Tron Name Service 
- can extend beyond your wallet, so users, developers, merchants and exchanges can benefit from easy of use, transparency and reliability of Tron ecosystem
- [x] Wallets: Provide a friendly way for users to send crypto using usernames
- [x] Exchanges: They can also call our HTTP API when their users are trying to send TRX to other users who have aliases. 
- [x] Contract addresses: DApp developers don’t have to modify existing contract addresses in their code everytime they modify & deploy new contracts. Contract alias will always point to the most current & correct contract address
