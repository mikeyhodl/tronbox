const Empty = artifacts.require('./Empty.sol');

module.exports = async function (deployer) {
  await deployer.deploy(Empty, { overwrite: false });
};
