const path = require('path');
const fs = require('fs');
const dir = require('node-dir');

module.exports = function findContracts(directory, callback) {
  if (!fs.existsSync(directory)) {
    return callback(null, []);
  }

  dir.files(directory, function (err, files) {
    if (err) return callback(err);

    callback(
      null,
      files.filter(file => path.extname(file) === '.sol')
    );
  });
};
