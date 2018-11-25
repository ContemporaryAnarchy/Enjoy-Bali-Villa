pragma solidity ^0.4.23;
import "./SafeMath.sol";

contract Lottery {
    using SafeMath for uint;

    address public owner;

    bool isInitialized = false;

    event lottoInitialized (
        uint softCap,
        uint hardCap,
        uint villaPrice,
        uint ticketPrice,
        uint startTime
    );

    event ticketPurchased (
        address buyer,
        uint amount
    );

    mapping (address => uint) ownerTicketCount;

    address[] buyerPosition;

    uint softCap;
    uint hardCap;
    uint villaPrice;
    uint ticketPrice;
    uint startTime;

    uint ticketsPurchased;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Not owner");
        _;
    }

    /**
    *   @dev Helper/Getter functions
    */

    function getData() public view returns (uint, uint, uint, uint, uint) {
        return (softCap, hardCap, villaPrice, ticketPrice, startTime);
    }

    function getTicketPrice() public view returns (uint) {
        return ticketPrice;
    }

    function getTicketAmount() public view returns (uint) {
        return (ownerTicketCount[msg.sender]);
    }

    function getbuyerPosition() public view returns (address[] memory) {
        return buyerPosition;
    }

    function getBuyerPositions(address buyer) public view returns (uint[] memory) {

        uint counter = 0;

        for (uint i = 0; i < buyerPosition.length; i++) {
            if (buyerPosition[i] == buyer) {
                counter++;
            }
        } 

        uint[] memory positions = new uint[](counter);
        uint p = 0;

        for (uint z = 0; z < buyerPosition.length; z++) {
            if (buyerPosition[z] == buyer) {
                p++;
                positions[p - 1] = z;
            }
        } 

        return positions;
    }

    
    /**
    *   @dev Initialize the lottery with the appropriate values. Only available to contract owner.
     */

    function initialize(uint256 soft, uint256 hard, uint256 villa, uint ticket, uint256 time) public onlyOwner {

        softCap = soft;
        hardCap = hard;
        villaPrice = villa;
        ticketPrice = ticket;
        startTime = now + time;

        emit lottoInitialized(softCap, hardCap, villaPrice, ticketPrice, startTime);
        isInitialized = true;
    }

    /**
    *   @dev Buy an amount of tickets based on the amount of ether sent and the ticket price. Available to      all lottery participants.
     */

    function buyTicket() public payable {
        require(isInitialized, "Lottery is not initialized.");
        require(msg.value > 0, "No ether sent.");

        uint value = msg.value;
        ownerTicketCount[msg.sender] += value.div(ticketPrice);
        ticketsPurchased += value.div(ticketPrice); 

        //instead of having ticket IDs, this design tracks the order in which addresses participate.
        buyerPosition.push(msg.sender);

        emit ticketPurchased(msg.sender, value.div(ticketPrice));
    }

}