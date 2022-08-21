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
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }],
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
            blockConfirmations: 6,
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
        },
        localhost: {
            chainId: 31337,
            //acounts : already in
        },
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: CMC_API_KEY,
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
};
