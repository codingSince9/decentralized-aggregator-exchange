const Migrations = artifacts.require("Migrations");
const ERC20 = artifacts.require("ERC20");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(ERC20, "USDC", "USDC");
};
