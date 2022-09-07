const { developmentChains, networkConfig } = require("../../helper-hardhat-config");
const { ethers, network, deployments } = require("hardhat");
const { assert, expect } = require("chai");

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
              accounts = await ethers.getSigners(); // could also do with getNamedAccounts
              deployer = accounts[0]; //or deployer = (await getNamedAccounts()).deployer;
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
                  // TODO make this check everything
                  const deKinoState = await deKinoContract.getDeKinoState();
                  const interval = await deKinoContract.getInterval();
                  assert.equal(deKinoState.toString(), "0");
                  assert.equal(interval, networkConfig[chainId]["keepersUpdateInterval"]);
              });
          });

          describe("enterDeKino", function () {
              it("reverts when you don't pay enough", async () => {
                  await expect(deKinoContract.enterDeKino()).to.be.revertedWith(
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
                  ).to.be.revertedWith("DeKino__NotOpen");
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

          // This test simulates users entering the raffle and wraps the entire functionality of the raffle
          // inside a promise that will resolve if everything is successful.
          // An event listener for the WinnerPicked is set up
          // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
          // All the assertions are done once the WinnerPicked event is fired
          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await deKinoContract.enterDeKino({ value: deKinoEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
              });
              it("can only be called after performupkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, deKinoContract.address) // reverts if not fulfilled
                  ).to.be.revertedWith("nonexistent request");
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, deKinoContract.address) // reverts if not fulfilled
                  ).to.be.revertedWith("nonexistent request");
              });
              it("picks a winner, resets, and sends money", async () => {
                  const additionalEntrances = 3; // to test
                  const startingIndex = 2;
                  for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
                      deKino = deKinoContract.connect(accounts[i]); // Returns a new instance of the deKino contract connected to player
                      await deKino.enterDeKino({ value: deKinoEntranceFee });
                  }
                  const startingTimeStamp = await deKino.getLastTimeStamp(); // stores starting timestamp (before we fire our event)

                  // This will be more important for our staging tests...
                  await new Promise(async (resolve, reject) => {
                      deKino.once("WinnerPicked", async () => {
                          // event listener for WinnerPicked
                          console.log("WinnerPicked event fired!");

                          // assert throws an error if it fails, so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          try {
                              // Now lets get the ending values...
                              const recentWinner = await deKino.getRecentWinner();
                              const deKinoState = await deKino.getDeKinoState();
                              const winnerBalance = await accounts[2].getBalance();
                              const endingTimeStamp = await deKino.getLastTimeStamp();
                              await expect(deKino.getPlayer(0)).to.be.reverted;
                              // Comparisons to check if our ending values are correct:
                              assert.equal(recentWinner.toString(), accounts[2].address);
                              assert.equal(deKinoState, 0);
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingBalance // startingBalance + ( (deKinoEntranceFee * additionalEntrances) + deKinoEntranceFee )
                                      .add(
                                          deKinoEntranceFee
                                              .mul(additionalEntrances)
                                              .add(deKinoEntranceFee)
                                      )
                                      .toString()
                              );
                              assert(endingTimeStamp > startingTimeStamp);
                              resolve(); // if try passes, resolves the promise
                          } catch (e) {
                              reject(e); // if try fails, rejects the promise
                          }
                      });

                      // kick off the event by mocking the chainlink keepers and vrf coordinator
                      const tx = await deKino.performUpkeep("0x");
                      const txReceipt = await tx.wait(1);
                      const startingBalance = await accounts[2].getBalance();
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          deKino.address
                      );
                  });
              });
          });
      });
