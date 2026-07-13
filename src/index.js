require('source-map-support/register');

const chalk = require('chalk');
const Command = require('./lib/command');
const downloader = require('./downloader');

const command = new Command(require('./lib/commands'));

const options = {
  logger: console
};

const commands = process.argv.slice(2);

if (commands[0] === '--download-compiler' && commands[1]) {
  downloader(commands[1], commands[2]).catch(err => {
    console.error(chalk.red(chalk.bold('ERROR:'), err.message || err));
    process.exit(1);
  });
} else {
  command.run(commands, options, function (err) {
    if (err) {
      if (typeof err === 'number') {
        // If a number is returned, exit with that number.
        process.exit(err);
      } else if (err && typeof err.message === 'string') {
        console.error(chalk.red(chalk.bold('ERROR:'), err.message));
      } else {
        // Handle other types (string, object, etc.)
        console.error(typeof err === 'string' ? err : String(err));
      }
      process.exit(1);
    }

    process.exit(0);
  });
}
