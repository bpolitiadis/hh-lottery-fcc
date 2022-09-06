const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("DeKino Staging Tests", function () {
          let deKino, deKinoEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              deKino = await ethers.getContract("DeKino", deployer)
              deKinoEntranceFee = await deKino.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the lottery
                  console.log("Setting up test...")
                  const startingTimeStamp = await deKino.getLastTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the lottery
                      deKino.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // asserts
                              const recentWinner = await deKino.getRecentWinner()
                              const deKinoState = await deKino.getDeKinoState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await deKino.getLastTimeStamp()

                              await expect(deKino.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(deKinoState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(deKinoEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // entering the lottery
                      console.log("Entering DeKino...")
                      const tx = await deKino.enterDeKino({ value: deKinoEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()

                      // and this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })

      // 1. Get SubscriptionId for Chainlink VRF
      // 2. Deploy using the subId
      // 3. Register contract with Chainlink VRF and it's subId
      // 4. Register contract with Chainlink Keepers
      // 5. Run stagin tests