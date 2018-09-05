module.exports = {
  Encryption: 'aes-256-cbc',
  Path: "m/44'/0'/0'/0/0",
  Bitcoin: {
    Decimals: 8,
    Satoshis: 100000000,
    Networks: {
      Testnet: 'testnet',
      Bitcoin: 'bitcoin',
    }
  },
  ReturnValues: {
    TransactionSubmitted: 'Transaction Submitted',
    NoFreeOutputs: 'No free outputs to spend',
    Fragments: {
      MinimumFeeNotMet: 'min relay fee not met',
    },
  },
  Messages: {
    Loading: 'Loading...'
  },
}
