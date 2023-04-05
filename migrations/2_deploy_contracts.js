const FullyLiquidDex = artifacts.require("FullyLiquidDecentralizedExchange");
const NotSoLiquidDex = artifacts.require("NotSoLiquidDecentralizedExchange");
const Usdc = artifacts.require("./ERC20/Usdc");
const Link = artifacts.require("./ERC20/Link");
const Matic = artifacts.require("./ERC20/Matic");
const Sushi = artifacts.require("./ERC20/Sushi");
const Wbtc = artifacts.require("./ERC20/Wbtc");

module.exports = async function (deployer) {
  await deployer.deploy(Usdc);
  const usdc = await Usdc.deployed();
  await deployer.deploy(Link);
  const link = await Link.deployed();
  await deployer.deploy(Matic);
  const matic = await Matic.deployed();
  await deployer.deploy(Sushi);
  const sushi = await Sushi.deployed();
  await deployer.deploy(Wbtc);
  const wbtc = await Wbtc.deployed();

  await deployer.deploy(
    FullyLiquidDex,
    link.address,
    matic.address,
    sushi.address,
    usdc.address,
    wbtc.address
  );
  const fullyLiquidDex = await FullyLiquidDex.deployed();
  await usdc.transfer(fullyLiquidDex.address, "1200000000000000000000000000");
  await link.transfer(fullyLiquidDex.address, "700000000000000000000000");
  await matic.transfer(fullyLiquidDex.address, "900000000000000000000000");
  await sushi.transfer(fullyLiquidDex.address, "950000000000000000000000");
  await wbtc.transfer(fullyLiquidDex.address, "35500000000000000000000");

  await deployer.deploy(
    NotSoLiquidDex,
    link.address,
    matic.address,
    sushi.address,
    usdc.address,
    wbtc.address
  );
  const notSoLiquidDex = await NotSoLiquidDex.deployed();
  await usdc.transfer(notSoLiquidDex.address, "1200000000000000000000000000");
  await link.transfer(notSoLiquidDex.address, "70000000000000000000000");
  await matic.transfer(notSoLiquidDex.address, "90000000000000000000000");
  await sushi.transfer(notSoLiquidDex.address, "95000000000000000000000");
  await wbtc.transfer(notSoLiquidDex.address, "3550000000000000000000");

  // transfer all assets to 0xf9D88523Dc246a624394142285F5B5e7E9200C3C
  const account8 = "0xD0D76B4C734CdEf0d66cfe3595A82538cfE6550e";
  const account9 = "0x5c8ce49DB19b2e7cd9FfD9853Cb91ba8Cf93e83f";
  await usdc.transfer(account8, "1000000000000000000000000");
  await link.transfer(account8, "1000000000000000000000000");
  await matic.transfer(account8, "1000000000000000000000000");
  await sushi.transfer(account8, "1000000000000000000000000");
  await wbtc.transfer(account8, "1000000000000000000000000");
  await usdc.transfer(account9, "1000000000000000000000000");
  await link.transfer(account9, "1000000000000000000000000");
  await matic.transfer(account9, "1000000000000000000000000");
  await sushi.transfer(account9, "1000000000000000000000000");
  await wbtc.transfer(account9, "1000000000000000000000000");
};
