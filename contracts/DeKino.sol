// Features:
// 1. Enter the lottery (paying some amount)
// 2. Pick a random winner (verifiably random)
// 3. Winner to be selected every X minutes -> completely automate
// 4. Chainlink Oracle -> Randomness, Automated execution (Chainlink Keeper)

//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error DeKino__NotEnoughETHEntered();
error DeKino__TransferFailed();
error DeKino__NotOpen();
error DeKino__UpKeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 deKinoState);

/**@title A sample Lottery Contract
 * @author vpo24
 * @notice This contract is for creating a sample lottery contract
 * @dev This implements the Chainlink VRF Version 2
 */
contract DeKino is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type declaration */
    enum DeKinoState {
        OPEN,
        CALCULATING
    }

    /* State Variables */
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //Lottery Variables
    address private s_recentWinner;
    DeKinoState private s_deKinoState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    event DeKinoEnter(address indexed player);
    event RequestDeKinoWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2, //contract
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_deKinoState = DeKinoState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterDeKino() public payable {
        if (msg.value < i_entranceFee) {
            revert DeKino__NotEnoughETHEntered();
        }
        if (s_deKinoState != DeKinoState.OPEN) {
            revert DeKino__NotOpen();
        }
        s_players.push(payable(msg.sender));
        //Emit an event when we update a dynamic array or mapping
        emit DeKinoEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between raffle runs.
     * 2. The lottery is open.
     * 3. The contract has ETH.
     * 4. Implicity, your subscription is funded with LINK.
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = DeKinoState.OPEN == s_deKinoState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        //return (upkeepNeeded, "0x0"); // can we comment this out?
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        // Request the random number
        // Once we get it do something with it
        // 2 transactions process
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert DeKino__UpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_deKinoState)
            );
        }
        s_deKinoState = DeKinoState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, //gasLane
            i_subscriptionId, //subscriptionId
            REQUEST_CONFIRMATIONS, //requestconfirmations
            i_callbackGasLimit, //callback gas limit
            NUM_WORDS //number of random numbers
        );
        emit RequestDeKinoWinner(requestId);
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send the money to the random winner.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_deKinoState = DeKinoState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert DeKino__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /* View / Pure function */
    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getDeKinoState() public view returns (DeKinoState) {
        return s_deKinoState;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
