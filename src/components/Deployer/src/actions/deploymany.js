const deploy = require('./deploy');

module.exports = function (arr, deployer) {
  return function () {
    return arr.reduce(function (promise, entry) {
      return promise.then(function (instances) {
        const [contract, ...args] = Array.isArray(entry) ? entry : [entry];
        return deploy(contract, args, deployer)().then(function (instance) {
          return instances.concat(instance);
        });
      });
    }, Promise.resolve([]));
  };
};
