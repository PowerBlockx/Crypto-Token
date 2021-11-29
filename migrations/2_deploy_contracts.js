const TauroToken = artifacts.require("TauroToken");
const TauroTokenSale = artifacts.require("TauroTokenSale");

module.exports = async function(deployer) {
  await deployer.deploy(TauroToken, 1000000);
  var tokenPrice = 1000000000000000 // 0.001 eth
  await deployer.deploy(TauroTokenSale, TauroToken.address, tokenPrice);
};