const colors = require('colors');
const TruffleError = require('@truffle/error');

class CompileError extends TruffleError {
  constructor(message) {
    // Note we trim() because solc likes to add extra whitespace.
    let fancy_message = message.trim() + '\n' + colors.red('Compilation failed. See above.');
    let normal_message = message.trim();

    if (
      /0\.5\.4/.test(normal_message) &&
      !!~normal_message.indexOf('Source file requires different compiler version')
    ) {
      normal_message =
        normal_message.split('ParserError:')[0] +
        '\nParserError: Source file requires different compiler version (current compiler is 0.5.4+commit.7b0de266.mod.Emscripten.clang)';
      fancy_message = normal_message + '\n' + colors.red('Compilation failed. See above.');
    }
    super(fancy_message);
  }
}

module.exports = CompileError;
