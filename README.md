# RMBitcoin

Provides a simple Bitcoin Wallet Interface for easy-to-use. Uses blockchain.info api.

## Install
`npm install rmbitcoinwallet --save`

## Use

### Import
```
import Wallet from 'rmbitcoinwallet'
```

### Init Wallet

```
const wallet = new Wallet(isTestnet);
```
```
wallet.init();   //Initialize Wallet by generating new keychain - wif and address
```
```
wallet.import(wif, address)     //Initalize Wallet by importing keychain.
```

### Get Wallet Info

```
const balance = wallet.getBalance()               //get balance of wallet
const price = wallet.price                        //get price of 1BTC as USD
```

### Set Update Handler

```
wallet.setUpdateHandler((coins, price) => {       //Add Handler for balance or price updates
  this.setState({
    coins: coins,
    price: price
  })
})

wallet.setResyncDuration(duration)                //Set resync duration -- default is 10s
```

### Send
```
await wallet.send(address, amount)                //Send coin to another wallet
```
