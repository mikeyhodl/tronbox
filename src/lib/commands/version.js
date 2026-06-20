const { maxVersion } = require('../../components/TronSolc');
const pkg = require('../pkg');
const describe = 'Show version information';

const command = {
  command: 'version',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${pkg.version}\n\n${describe}\n
Usage: $0 version`
      )
      .version(false)
      .group(['help'], 'Options:');
  },
  run: function (options, done) {
    process.env.CURRENT = 'version';

    options.logger.log('TronBox v' + pkg.version);
    options.logger.log('Solidity v' + maxVersion + ' (tron-solc)');

    done();
  }
};

module.exports = command;
