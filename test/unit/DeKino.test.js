const { developmentChains, networkConfig } = require("../../helper-hardhat-config");
const { ethers, network, deployments } = require("hardhat");
const { assert, expect } = require("chai");
const { describe } = require("node:test");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DeKino Unit Test", function () {
          let deKinoContract,
              deKinoPlayer,
              vrfCoordinatorV2Mock,
              deKinoEntranceFee,
              interval,
              deployer;
          const chainId = network.config.chainId;

          beforeEach(async () => {
              //deployer = (await getNamedAccounts()).deployer;
              accounts = await ethers.getSigners(); // could also do with getNamedAccounts
              deployer = accounts[0];
              player = accounts[1];
              await deployments.fixture(["all", "mocks"]); // deploy everything
              deKinoContract = await ethers.getContract("DeKino", deployer);
              deKinoPlayer = deKinoContract.connect(player); // Returns a new instance of the DeKino contract connected to player
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);

              deKinoEntranceFee = await deKinoContract.getEntranceFee();
              interval = await deKinoContract.getInterval();
          });

          describe("constructor", function () {
              it("initializes the lottery correctly", async () => {
                  // Ideally, we'd separate these out so that only 1 assert per "it" block
                  // And ideally, we'd make this check everything
                  const deKinoState = await deKinoContract.getDeKinoState();
                  const interval = await deKinoContract.getInterval();
                  assert.equal(deKinoState.toString(), "0");
                  assert.equal(interval, networkConfig[chainId]["keepersUpdateInterval"]);
              });
          });

          describe("enterDeKino", function () {
              it("reverts when you don't pay enough", async () => {
                  await expect(deKinoContract.enterDeKino()).to.be.revertedWith(
                      // is reverted when not paid enough or lottery is not open
                      "DeKino__NotEnoughETHEntered"
                  );
              });
              it("records player when they enter", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  const contractPlayer = await deKinoContract.getPlayer(0);
                  assert.equal(deployer.address, contractPlayer);
              });
              it("emits event on enter", async () => {
                  await expect(deKinoContract.enterDeKino({ value: deKinoEntranceFee })).to.emit(
                      // emits DeKinoEnter event if entered to index player(s) address
                      deKinoContract,
                      "DeKinoEnter"
                  );
              });
              it("doesn't allow entrance when lottery is calculating", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]); //  https://hardhat.org/hardhat-network/reference
                  await network.provider.send("evm_mine", []);

                  await deKinoContract.performUpkeep([]); // changes the state to calculating for our comparison below
                  await expect(
                      deKinoContract.enterDeKino({ value: deKinoEntranceFee })
                  ).to.be.revertedWith(
                      // is reverted as lottery is calculating
                      "DeKino__NotOpen"
                  );
              });
          });

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const { upkeepNeeded } = await deKinoContract.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded);
              });
              it("returns false if DeKino isn't open", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  await deKinoContract.performUpkeep([]);
                  const deKinoState = await deKinoContract.getDeKinoState();
                  const { upkeepNeeded } = await deKinoContract.callStatic.checkUpkeep([]);
                  assert.equal(deKinoState.toString(), "1");
                  assert.equal(upkeepNeeded, false);
              });
              it("returns false if enough time hasn't passed", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 4]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const { upkeepNeeded } = await deKinoContract.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded);
              });
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const { upkeepNeeded } = await deKinoContract.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded);
              });
          });

          describe("performUpkeep", function () {
              it("it can only run if checkUpkeep is true", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const tx = await deKinoContract.performUpkeep("0x");
                  assert(tx);
              });
              it("reverts if checkup is false", async () => {
                  await expect(deKinoContract.performUpkeep("0x")).to.be.revertedWith(
                      "DeKino__UpKeepNotNeeded"
                  );
              });
              it("updates the lottery state, emits the event, and calls vrf coordinator", async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const txResponse = await deKinoContract.performUpkeep([]);
                  const txReceipt = await txResponse.wait(1);
                  const requestId = txReceipt.events[1].args.requestId;
                  const deKinoState = await deKinoContract.getDeKinoState();
                  assert(requestId.toNumber() > 0);
                  assert(deKinoState.toString() == "1");
              });
          });

          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
              });
              it("can only be called after performupkeep", async () => {});
              it("picks a winner, resets, and sends money", async () => {});
          });
      });
