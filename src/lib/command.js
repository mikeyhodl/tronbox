const TronBoxError = require('./errors/tronBoxError');
const yargs = require('yargs/yargs');
const _ = require('lodash');
const version = require('./version');

function Command(commands) {
  this.commands = commands;

  const args = yargs().detectLocale(false).exitProcess(false);

  Object.keys(this.commands).forEach(command => {
    args.command(this.commands[command]);
  });

  this.args = args;
}

Command.prototype.getCommand = function (cmds) {
  const args = yargs().detectLocale(false).exitProcess(false).version(false).help(false);

  Object.keys(this.commands).forEach(command => {
    args.command(this.commands[command]);
  });

  const argv = args.parse(cmds);

  if (argv._.length === 0) {
    argv._.push('help');
  }

  const input = argv._[0];

  if (!this.commands[input]) return null;

  return {
    name: input,
    argv: argv,
    command: this.commands[input]
  };
};

Command.prototype.run = function (command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const result = this.getCommand(command);

  if (!result) {
    return callback(
      new TronBoxError(
        `\`tronbox ${command[0]}\` is an invalid command.

Please use \`tronbox help\` to see a list of available commands.

TronBox v${version.bundle}`
      )
    );
  }

  const argv = result.argv;

  // Remove the task name itself.
  if (argv._) {
    argv._.shift();
  }

  // We don't need this.
  delete argv['$0'];

  // Some options might throw if options is a Config object. If so, let's ignore those options.
  const clone = {};
  Object.keys(options).forEach(function (key) {
    try {
      clone[key] = options[key];
    } catch (e) {
      // Do nothing with values that throw.
    }
  });

  options = _.extend(clone, argv);
  options.commands = this.commands;

  if (result.name !== 'help' && argv.help) {
    this.args.parse(command);
    return callback();
  }

  try {
    result.command.run(options, callback);
  } catch (err) {
    callback(err);
  }
};

module.exports = Command;
