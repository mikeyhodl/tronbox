const path = require('path');
const NPMSource = require('./npm');
const FSSource = require('./fs');
const contract = require('../Contract');
const { expect } = require('../../lib/utils');
const provision = require('../Provisioner');

function Resolver(options) {
  expect.options(options, ['working_directory', 'contracts_build_directory']);

  this.options = options;

  this.npmSource = new NPMSource(options.working_directory);
  this.fsSource = new FSSource(options.working_directory, options.contracts_build_directory);
  this.sources = [this.npmSource, this.fsSource];
}

// This function might be doing too much. If so, too bad (for now).
Resolver.prototype.require = function (import_path, search_path) {
  const self = this;

  for (let i = 0; i < this.sources.length; i++) {
    const source = this.sources[i];
    const result = source.require(import_path, search_path);
    if (result) {
      const abstraction = contract(result);
      provision(abstraction, self.options);
      return abstraction;
    }
  }
  throw new Error('Could not find artifacts for ' + import_path + ' from any sources');
};

// Dispatch by import path style:
//   absolute path or starts with '.' / '..' → file system
//   anything else → npm package lookup
// User-written absolute imports are rejected upstream by the profiler before
// path normalization, so they don't reach the dispatcher.
Resolver.prototype.resolve = function (import_path, imported_from, callback) {
  if (typeof imported_from === 'function') {
    callback = imported_from;
    imported_from = null;
  }

  const useFs = path.isAbsolute(import_path) || import_path.startsWith('.');
  const source = useFs ? this.fsSource : this.npmSource;

  source.resolve(import_path, imported_from, function (err, body, file_path, package_info) {
    if (err) return callback(err);
    if (!body) {
      let message = 'Could not find ' + import_path + ' from any sources';
      if (imported_from) {
        message += '; imported from ' + imported_from;
      }
      return callback(new Error(message));
    }
    callback(null, body, file_path, source, package_info);
  });
};

module.exports = Resolver;
