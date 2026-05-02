const chalk = require('chalk');
const TronBoxError = require('./tronBoxError');

class CompileError extends TronBoxError {
  constructor(message) {
    // Note we trim() because solc likes to add extra whitespace.
    super(message.trim() + '\n\n' + chalk.red('Compilation failed. See above.'));
  }
}

module.exports = CompileError;
