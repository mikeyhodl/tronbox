const TruffleError = require('@truffle/error');

const defaultGas = 90000;

class StatusError extends TruffleError {
  constructor(args, tx, receipt) {
    let message;
    const gasLimit = parseInt(args.gas) || defaultGas;

    if (receipt.gasUsed === gasLimit) {
      message =
        'Transaction: ' +
        tx +
        ' exited with an error (status 0) after consuming all gas.\n' +
        'Please check that the transaction:\n' +
        '    - satisfies all conditions set by Solidity `assert` statements.\n' +
        '    - has enough gas to execute the full transaction.\n' +
        '    - does not trigger an invalid opcode by other means (ex: accessing an array out of bounds).';
    } else {
      message =
        'Transaction: ' +
        tx +
        ' exited with an error (status 0).\n' +
        'Please check that the transaction:\n' +
        '    - satisfies all conditions set by Solidity `require` statements.\n' +
        '    - does not trigger a Solidity `revert` statement.\n';
    }

    super(message);
    this.tx = tx;
    this.receipt = receipt;
  }
}

module.exports = StatusError;
