const Sandbox = artifacts.require('./Sandbox.sol');

module.exports = async function (deployer) {
  await deployer.deploy(Sandbox, 10000);
};
