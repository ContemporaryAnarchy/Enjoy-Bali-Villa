pragma solidity ^0.4.23;

contract Lottery {
    address public owner;

    mapping (address => uint) ownerTicketCount;

    struct Ticket {
        uint16 id;
        uint8 price;
    }
    
    event lottoInitialized (
        uint softCap,
        uint hardCap,
        uint villaPrice
    );

    event ticletPurchased (
        address buyer,
        uint id
    );

    mapping (address => Ticket) ownerToTicket;

    uint softCap;
    uint hardCap;
    uint villaPrice;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Not owner");
        _;
    }

    function initialize(uint soft, uint hard, uint price) public onlyOwner {
        softCap = soft;
        hardCap = hard;
        villaPrice = price;
        emit lottoInitialized(softCap, hardCap, villaPrice);
    }


}