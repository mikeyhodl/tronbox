const TronBoxError = require('./tronBoxError');

class NotDeployedError extends TronBoxError {
  constructor(contractName, address) {
    let message = `${contractName} has not been deployed to detected network`;
    if (address) {
      message += `; no code at address ${address}`;
    }
    super(message);
  }
}

module.exports = NotDeployedError;
