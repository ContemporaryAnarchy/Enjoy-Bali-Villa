var Lottery = artifacts.require("./Lottery.sol");

module.exports = function (deployer) {
    deployer.deploy(Lottery, { from: web3.eth.accounts[0], value: 1e18 });
};
