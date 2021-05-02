require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-truffle5");

const keys = require('./dev-keys.json');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/" + keys.alchemyKey,
        blockNumber: 12342966, // <-- edit here
      }
    }
  },
  solidity: {
    compilers: [
      {version: "0.7.3"},
    ]
  },
  mocha: {
    timeout: 2000000
  }
};
