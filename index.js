const Constants = require('./constants')
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const { exchange, blockexplorer, pushtx } = require('blockchain.info');

let c_network
let c_blockexplorer
let c_pushtx
const c_exchange = exchange;

let duration = 10000
let timer = null

class BitcoinWallet {
  constructor(isTestnet = false) {
    if (isTestnet) {
      c_blockexplorer = blockexplorer.usingNetwork(3);
      c_pushtx = pushtx.usingNetwork(3).pushtx;
      c_network = bitcoin.networks.testnet
    } else {
      c_blockexplorer = blockexplorer;
      c_pushtx = pushtx.pushtx;
      c_network = bitcoin.networks.bitcoin;
    }

    this.price = 1.0
    this.updateHandler = null
    this.satoshisBalance = null
  }

  async init() {
    this.keyChain = await this.generateKeys()
    await this.getStatus()
    timer = this.startResyncLoop()
  }

  async import(wif, address) {
    this.keyChain = {
      wif: wif,
      address: address
    }
    await this.getStatus()
    timer = this.startResyncLoop()
  }

  setUpdateHandler(handler) {
    this.updateHandler = handler
  }

  startResyncLoop() {
    if (duration > 0) {
      return setInterval(() => this.resync(), duration)
    }
    return null
  }

  stopResyncLoop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  // Get Info
  async getStatus() {
    const { utxos, satoshis } = await this.getUnspentOutputs()
    this.utxos = utxos
    this.satoshisBalance = satoshis
    this.price = await this.getPrice()
  }

  async resync() {
    try {
      const prevBalance = this.satoshisBalance
      const prevPrice = this.price
      await this.getStatus()
      if (this.updateHandler !== null && (this.satoshisBalance !== prevBalance || this.price !== prevPrice)) {
        this.updateHandler(this.getBalance(), this.price)
      }
      return true
    } catch (e) { }
    return false
  }

  setResyncDuration(dur = 10000) {
    if (duration !== dur) {
      this.stopResyncLoop()
      timer = this.startResyncLoop()
      duration = dur
    }
  }

  getKeyChain() {
    return this.keyChain
  }

  getAddress() {
    if (this.keyChain) return this.keyChain.address
    return Constants.Messages.Loading
  }

  getBalance() {
    return this.toCoin(this.satoshisBalance)
  }

  // API
  async generateKeys() {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeed(mnemonic)
    const master = bitcoin.HDNode.fromSeedBuffer(seed, c_network);
    const derived = master.derivePath(Constants.Path);
    const address = derived.getAddress();
    const wif = derived.keyPair.toWIF();

    return {
      address: address,
      wif: wif,
    }
  }

  getPrice(currency = 'USD') {
    return new Promise((resolve, reject) => {
      c_exchange.getTicker({ currency: currency})
        .then(r => resolve(r.sell))
        .catch(err => reject(err))
    })
  }

  getUnspentOutputs() {
    return new Promise((resolve, reject) => {
      c_blockexplorer.getUnspentOutputs(this.keyChain.address).then((result) => {
        resolve({
          utxos: result.unspent_outputs,
          satoshis: result.unspent_outputs.reduce((a, c) => a + c.value, 0)
        });
      }).catch(err => reject(err));
    })  
  }

  async send(receiver, amount) {
    
    const fee = this.toSatoshis(0.0000374)

    const satoshis = Math.round(this.toSatoshis(amount));
    const txb = new bitcoin.TransactionBuilder(c_network);

    let current = 0;
    for (const utx of this.utxos) {

      txb.addInput(utx.tx_hash_big_endian, utx.tx_output_n);

      current += utx.value;
      if (current >= (satoshis + fee)) break;
    }

    txb.addOutput(receiver, satoshis);

    const change = current - (satoshis + fee);

    console.log(change, current, satoshis + fee)

    if (change) txb.addOutput(this.keyChain.address, change);

    const key = bitcoin.ECPair.fromWIF(this.keyChain.wif, c_network);

    console.log('key: ', key)
    txb.sign(0, key);

    const raw = txb.build().toHex();

    return new Promise((resolve, reject) => {
      c_pushtx(raw).then(result => resolve(result === Constants.ReturnValues.TransactionSubmitted));
    })
  }

  // Extra
  toSatoshis(coin) {
    return coin * Constants.Bitcoin.Satoshis
  }

  toCoin(satoshis) {
    return satoshis / Constants.Bitcoin.Satoshis
  }
}

module.exports = BitcoinWallet