const { maxVersion } = require('../../components/TronSolc');
const version = require('../version');
const describe = 'Show version information';

const command = {
  command: 'version',
  describe,
  builder: yargs => {
    yargs
      .usage(
        `TronBox v${version.bundle}\n\n${describe}\n
Usage: $0 version`
      )
      .version(false)
      .group(['help'], 'Options:');
  },
  run: function (options, done) {
    process.env.CURRENT = 'version';

    let bundle_version;

    if (version.bundle) {
      bundle_version = 'v' + version.bundle;
    } else {
      bundle_version = '(unbundled)';
    }

    options.logger.log('TronBox ' + bundle_version);
    options.logger.log('Solidity v' + maxVersion + ' (tron-solc)');

    done();
  }
};

module.exports = command;
