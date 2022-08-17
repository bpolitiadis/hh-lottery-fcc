// Features:
// 1. Enter the lottery (paying some amount)
// 2. Pick a random winner (verifiably random)
// 3. Winner to be selected every X minutes -> completely automate
// 4. Chainlink Oracle -> Randomness, Automated execution (Chainlink Keeper)

//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error DeKino__NotEnoughETHEntered();

contract DeKino is VRFConsumerBaseV2 {
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    event DeKinoEnter(address indexed player);

    constructor(address vrfCoordinator, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
    }

    function enterDeKino() public payable {
        if (msg.value < i_entranceFee) {
            revert DeKino__NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender));
        //Emit an event when we update a dynamic array or mapping
        emit DeKinoEnter(msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {}

    /* View / Pure function */
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
