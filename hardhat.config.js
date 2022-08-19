const { network } = require("hardhat");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY;
const CMC_API_KEY = process.env.CMC_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.8.0" }],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [DEV_PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: network.config.blockConfirmations || 1,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [DEV_PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
            gas: 2100000,
            gasPrice: 8000000000,
        },
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
            //acounts : already in
        },
    },
};
