// thanks Xavier Leprêtre
// https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6

const waitForTransactionReceipt =
  tronWeb =>
  (txHash = false, interval = 500, maxRetries = 240) => {
    const transactionReceiptAsync = (resolve, reject, retries = 0) => {
      tronWeb.trx
        .getTransactionInfo(txHash)
        .then(receipt => {
          if (!receipt || JSON.stringify(receipt) === '{}') {
            if (retries >= maxRetries) {
              reject(new Error(`Transaction receipt not found: ${txHash}`));
              return;
            }
            setTimeout(() => transactionReceiptAsync(resolve, reject, retries + 1), interval);
          } else {
            resolve(receipt);
          }
        })
        .catch(error => {
          reject(error);
        });
    };
    if (Array.isArray(txHash)) {
      return Promise.all(txHash.map(oneTxHash => waitForTransactionReceipt(tronWeb)(oneTxHash, interval, maxRetries)));
    } else if (typeof txHash === 'string') {
      return new Promise(transactionReceiptAsync);
    } else {
      throw new Error('Invalid Type: ' + txHash);
    }
  };

module.exports = waitForTransactionReceipt;
