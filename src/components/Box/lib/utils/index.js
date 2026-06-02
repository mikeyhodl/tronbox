const fs = require('fs-extra');
const unbox = require('./unbox');

module.exports = {
  downloadBox: function (url, destination) {
    let tmpDir;

    return Promise.resolve()
      .then(function () {
        return unbox.checkDestination(destination);
      })
      .then(function () {
        return unbox.verifyURL(url);
      })
      .then(function () {
        tmpDir = unbox.setupTempDirectory();
      })
      .then(function () {
        return unbox.fetchRepository(url, tmpDir);
      })
      .then(function () {
        return unbox.copyTempIntoDestination(tmpDir, destination);
      })
      .finally(function () {
        if (tmpDir) {
          try {
            fs.removeSync(tmpDir);
          } catch (e) {}
        }
      });
  },

  unpackBox: function (destination) {
    let boxConfig;

    return Promise.resolve()
      .then(function () {
        return unbox.readBoxConfig(destination);
      })
      .then(function (cfg) {
        boxConfig = cfg;
      })
      .then(function () {
        return unbox.cleanupUnpack(boxConfig, destination);
      })
      .then(function () {
        return boxConfig;
      });
  },

  setupBox: function (boxConfig, destination) {
    return Promise.resolve()
      .then(function () {
        return unbox.installBoxDependencies(boxConfig, destination);
      })
      .then(function () {
        return boxConfig;
      });
  }
};
