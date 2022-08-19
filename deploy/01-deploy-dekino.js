module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const deKino = await deploy("DeKino", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 6,
    });
};
