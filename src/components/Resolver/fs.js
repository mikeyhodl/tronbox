const path = require('path');
const fs = require('fs');

function FS(working_directory, contracts_build_directory) {
  this.working_directory = working_directory;
  this.contracts_build_directory = contracts_build_directory;
}

FS.prototype.requireJson = function (import_path) {
  let file_path = import_path;
  if (!file_path.startsWith('./')) {
    file_path = `./node_modules/${file_path}`;
  }

  try {
    const workingDirectoryPath = path.resolve(this.working_directory);
    const resolvedPath = path.resolve(workingDirectoryPath, file_path);
    const relative = path.relative(workingDirectoryPath, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`${import_path} is outside the project directory.`);
    }

    const result = fs.readFileSync(resolvedPath, 'utf8');
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
};

FS.prototype.require = function (import_path, search_path) {
  search_path = search_path || this.contracts_build_directory;

  // For Windows: Allow import paths to be either path separator ('\' or '/')
  // by converting all '/' to the default (path.sep);
  import_path = import_path.replace(/\//g, path.sep);

  if (path.extname(import_path) === '.json') {
    return this.requireJson(import_path);
  }

  if (import_path.includes(path.sep)) {
    return null;
  }

  const contract_name = path.basename(import_path, '.sol');

  try {
    const result = fs.readFileSync(path.join(search_path, contract_name + '.json'), 'utf8');
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
};

FS.prototype.resolve = function (import_path, imported_from, callback) {
  // Resolver dispatches absolute paths here; profiler pre-resolves './' / '../'
  // imports to absolute paths via resolve_dependency_path before they re-enter.
  if (!path.isAbsolute(import_path)) {
    return callback(new Error(`"${import_path}" could not be resolved.`));
  }
  const workingDirectoryPath = path.resolve(this.working_directory);
  const relative = path.relative(workingDirectoryPath, import_path);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return callback(new Error(`${import_path} is outside the project directory.`));
  }

  fs.readFile(import_path, { encoding: 'utf8' }, function (err, body) {
    callback(null, err ? undefined : body, import_path);
  });
};

// Here we're resolving from local files to local files, all absolute.
FS.prototype.resolve_dependency_path = function (import_path, dependency_path) {
  const dirname = path.dirname(import_path);
  return path.resolve(path.join(dirname, dependency_path));
};

module.exports = FS;
