const path = require('path');

// Validate that an import path looks like a well-formed npm reference:
//   - unscoped:  "pkg/path/to/file.sol"           (at least one '/')
//   - scoped:    "@scope/pkg/path/to/file.sol"    (at least two '/')
// Reject absolute paths and any '..' segments — those aren't module references.
function isValidNpmImportPath(importPath) {
  if (path.isAbsolute(importPath)) return false;
  if (importPath.split('/').includes('..')) return false;
  if (importPath.startsWith('@')) {
    return (importPath.match(/\//g) || []).length >= 2;
  }
  return importPath.includes('/');
}

const INVALID_IMPORT_MESSAGE = importPath =>
  `Invalid import "${importPath}". Local files must start with './' or '../'; ` +
  `npm imports must look like 'package/path' or '@scope/package/path'.`;

module.exports = { isValidNpmImportPath, INVALID_IMPORT_MESSAGE };
