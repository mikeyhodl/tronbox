const path = require('path');

// An import path that is absolute or contains a '..' segment (either separator).
// Not a module/relative reference, and a path-traversal risk.
function isAbsoluteOrTraversal(importPath) {
  return path.isAbsolute(importPath) || /(^|[\\/])\.\.([\\/]|$)/.test(importPath);
}

// Validate that an import path looks like a well-formed npm reference:
//   - unscoped:  "pkg/path/to/file.sol"           (at least one '/')
//   - scoped:    "@scope/pkg/path/to/file.sol"    (at least two '/')
function isValidNpmImportPath(importPath) {
  if (isAbsoluteOrTraversal(importPath)) return false;
  if (importPath.startsWith('@')) {
    return (importPath.match(/\//g) || []).length >= 2;
  }
  return importPath.includes('/');
}

const INVALID_IMPORT_MESSAGE = importPath =>
  isAbsoluteOrTraversal(importPath)
    ? `Invalid import "${importPath}". Import paths may not be absolute or contain '..' segments.`
    : `Invalid import "${importPath}". Local files must start with './' or '../'; ` +
      `npm imports must look like 'package/path' or '@scope/package/path'.`;

module.exports = { isValidNpmImportPath, INVALID_IMPORT_MESSAGE };
