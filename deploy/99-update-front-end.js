const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat-config")
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating FrontEnd...");
        console.log("__dirname: ", __dirname);
        console.log("path: ", path.basename(__dirname));
        await updateContractAddresses();
        await updateAbi();
        console.log("FrontEnd updated!");
    }
};

async function updateAbi() {
    const deKino = await ethers.getContract("DeKino");
    fs.writeFileSync(frontEndAbiFile, deKino.interface.format(ethers.utils.FormatTypes.json));
}

async function updateContractAddresses() {
    const deKino = await ethers.getContract("DeKino");
    const chainId = network.config.chainId.toString();
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"));

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].includes(deKino.address)) {
            contractAddresses[chainId].push(deKino.address);
        }
    } else {
        contractAddresses[chainId] = [deKino.address];
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}

module.exports.tags = ["all", "frontend"]
