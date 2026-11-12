const DPLedger = artifacts.require("DPLedger");

module.exports = function (deployer) {
  deployer.deploy(DPLedger);
};