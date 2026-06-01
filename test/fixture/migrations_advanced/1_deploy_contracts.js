const Roster = artifacts.require('./Roster.sol');

module.exports = async function (deployer) {
  await deployer.deploy(Roster, ['Tom', '30'], {});
};
