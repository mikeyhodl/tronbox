const deploy = require('./deploy');

module.exports = function (arr, deployer) {
  return function () {
    const deployments = arr.map(function (entry) {
      const [contract, ...args] = Array.isArray(entry) ? entry : [entry];
      return deploy(contract, args, deployer)();
    });

    return Promise.all(deployments);
  };
};
