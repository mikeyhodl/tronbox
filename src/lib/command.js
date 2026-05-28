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

Command.prototype.getCommand = function (cmds, noAliases) {
  const args = yargs().detectLocale(false).exitProcess(false).version(false).help(false);

  Object.keys(this.commands).forEach(command => {
    args.command(this.commands[command]);
  });

  const argv = args.parse(cmds);

  if (argv._.length === 0) {
    argv._.push('help');
  }

  const input = argv._[0];
  let chosenCommand = null;

  // If the command wasn't specified directly, go through a process
  // for inferring the command.
  if (this.commands[input]) {
    chosenCommand = input;
  } else if (noAliases !== true) {
    let currentLength = 1;
    const availableCommandNames = Object.keys(this.commands);

    // Loop through each letter of the input until we find a command
    // that uniquely matches.
    while (currentLength <= input.length) {
      // Gather all possible commands that match with the current length
      const possibleCommands = availableCommandNames.filter(function (possibleCommand) {
        return possibleCommand.substring(0, currentLength) === input.substring(0, currentLength);
      });

      // Did we find only one command that matches? If so, use that one.
      if (possibleCommands.length === 1) {
        chosenCommand = possibleCommands[0];
        break;
      }

      currentLength += 1;
    }
  }

  if (!chosenCommand) {
    return null;
  }

  const command = this.commands[chosenCommand];

  return {
    name: chosenCommand,
    argv: argv,
    command: command
  };
};

Command.prototype.run = function (command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const result = this.getCommand(command, typeof options.noAliases === 'boolean' ? options.noAliases : true);

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
