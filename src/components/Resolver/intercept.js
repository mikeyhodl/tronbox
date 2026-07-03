function ResolverIntercept(resolver) {
  this.resolver = resolver;
  this.cache = Object.create(null);
}

ResolverIntercept.prototype.require = function (import_path) {
  // Modify import_path so the cache key is consistently the same irrespective
  // of whether a user explicated .sol extension
  import_path = import_path.replace(/^\.\//, '').replace(/\.sol$/i, '');

  // TODO: Using the import path for relative files may result in multiple
  // paths for the same file. This could return different objects since it won't be a cache hit.
  if (this.cache[import_path]) {
    return this.cache[import_path];
  }

  // Note, will error if nothing is found.
  const resolved = this.resolver.require(import_path);

  this.cache[import_path] = resolved;

  // The chain may be slow to accept transactions; never time out the wait.
  resolved.synchronization_timeout = 0;

  return resolved;
};

ResolverIntercept.prototype.contracts = function () {
  const self = this;
  return Object.keys(this.cache).map(function (key) {
    return self.cache[key];
  });
};

module.exports = ResolverIntercept;
