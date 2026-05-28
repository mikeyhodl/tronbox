const fs = require('fs');
const path = require('path');
const Module = require('module');
const vm = require('vm');
const { expect } = require('../lib/utils');
const Config = require('./Config');

// options.file: path to file to execute. Must be a module that exports a function.
// options.args: arguments passed to the exported function within file. If a callback
//   is not included in args, exported function is treated as synchronous.
// options.context: Object containing any global variables you'd like set when this
//   function is run.
const Require = {
  file: options => {
    const file = path.resolve(options.file);

    expect.options(options, ['file']);

    options = Config.default().with(options);

    const source = fs.readFileSync(file, { encoding: 'utf8' });

    const scriptModule = new Module(file);

    // Provide all the globals listed here: https://nodejs.org/api/globals.html
    const sandbox = {
      // CJS module-wrapper locals
      __filename: file,
      __dirname: path.dirname(file),
      module: scriptModule,
      exports: scriptModule.exports,
      require: Module.createRequire(file),

      // Node globals
      Buffer,
      clearImmediate,
      clearInterval,
      clearTimeout,
      console,
      global,
      process,
      setImmediate,
      setInterval,
      setTimeout,

      // TronBox injections
      artifacts: options.resolver
    };

    // Now add contract names.
    Object.keys(options.context || {}).forEach(key => {
      sandbox[key] = options.context[key];
    });

    const context = vm.createContext(sandbox);

    const old_cwd = process.cwd();
    process.chdir(path.dirname(file));

    const script = new vm.Script(source, { filename: file });
    try {
      script.runInContext(context);
    } finally {
      process.chdir(old_cwd);
    }

    return scriptModule.exports;
  }
};

module.exports = Require;
