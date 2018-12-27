pragma solidity ^0.4.23;
import "./SafeMath.sol";
import "./oraclize_API.sol";

contract Lottery is usingOraclize {
    /**
    *   @dev Variables, Mappings & Modifiers
    */
    
    using SafeMath for uint;
    
    bytes newProof;

    address public owner;
    address[] buyerPosition;
    
    uint public testValue;

    uint constant gasLimitForOraclize = 175000;
    uint public softCap;
    uint public hardCap;
    uint public ticketPrice;
    uint public startTime;
    uint public ticketsPurchased;
    uint public playerCount;
    
    bool public isInitialized = false;
    
    mapping (address => uint) ownerTicketCount;
    mapping (bytes32 => bool) validId;
    
    modifier onlyOwner() {
        require(owner == msg.sender, "Not owner");
        _;
    }
    
    /**
    *   @dev Events
    */
    
    event lottoInitialized (
        uint softCap,
        uint hardCap,
        uint ticketPrice,
        uint startTime
    );

    event ticketPurchased (
        address buyer,
        uint amount
    );

    event logNumberReceived (
        uint number
    );
    
    event logQuery (
        string description
    );
    
    event winner (
        address winner
    );

    /**
    *   @dev Constructor
    */
    
    constructor() public payable {
        owner = msg.sender;
        testValue = 1;
        oraclize_setCustomGasPrice(1000000000 wei);
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
    }

    /**
    *   @dev Helper/Getter functions
    */

    function getTicketAmount(address _owner) public view returns (uint) {
        return (ownerTicketCount[_owner]);
    }

    function getValues() public view returns (uint, uint, uint) {
        return (softCap, hardCap, startTime);
    }

    function contractBalance() public view returns(uint) {
        return address(this).balance;
    }
    
    /**
    *   @dev Initialize the lottery with the appropriate values. Only available to contract owner.
     */

    function initialize(uint256 soft, uint256 hard, uint ticket, uint256 time) public onlyOwner {
        require(!isInitialized, "Lottery is already initialized!");
        isInitialized = true;
        
        softCap = soft;
        hardCap = hard;
        ticketPrice = ticket;
        startTime = now + time;

        emit lottoInitialized(softCap, hardCap, ticketPrice, startTime);
        
    }
    
    function _resetBalances() private {
        ticketsPurchased = 0;
        softCap = 0;
        hardCap = 0;
        ticketPrice = 0;
        startTime = 0;
        playerCount = 0;
        
        for (uint i = 0; i < buyerPosition.length; i++) {
            ownerTicketCount[buyerPosition[i]] = 0; 
        }
        
        buyerPosition.length = 0;
        
        
    }

    /**
    *   @dev Give a free first ticket to anyone who has been verified. verification is done off-chain and the owner calls the function. (OnlyOwner)
     */
    
    function freeTicket(address buyer) public onlyOwner {
        require(isInitialized, "Lottery is not initialized.");
        require(ownerTicketCount[buyer] == 0, "Buyer already has tickets.");

        playerCount = playerCount.add(1);

        ownerTicketCount[buyer] = ownerTicketCount[buyer].add(1);
        ticketsPurchased = ticketsPurchased.add(1);

        buyerPosition.push(buyer);

        emit ticketPurchased(buyer, 1);
    }

    /**
    *   @dev Buy an amount of tickets based on the amount of ether sent and the ticket price. Available to      all lottery participants.
     */

    function buyTicket() public payable {
        require(isInitialized, "Lottery is not initialized.");
        require(msg.value > 0, "No ether sent.");
        
        uint value = msg.value.div(ticketPrice);
        ownerTicketCount[msg.sender] = ownerTicketCount[msg.sender].add(value);
        ticketsPurchased = ticketsPurchased.add(value);

        playerCount = playerCount.add(1);

        //instead of having ticket IDs, this design tracks the order in which addresses participate.
        buyerPosition.push(msg.sender);

        emit ticketPurchased(msg.sender, value);
    }
    
    /**
     * @dev Oraclize callback function
    */
    
    function __callback(bytes32 qId, string result, bytes proof) public {
        require(msg.sender == oraclize_cbAddress(), "Wrong address");
        require(validId[qId], "Invalid ID");
        
        newProof = proof;
        
        uint randomNumber = parseInt(result);
        
        emit logNumberReceived(randomNumber);
        
        validId[qId] = false;
        
        emit winner(getWinner(randomNumber));
        
    }
    
    /**
     * @dev Oraclize query to random.org. Fetches one random number between 0 and the
     * total amount of tickets purchased. Returns the value in the callback above and calls the winner. 
    */
    
    function drawWinner() public onlyOwner {
        require(isInitialized, "Lottery is not initialized");
        isInitialized = false;  
        
        _setQuery2();   
        _setQuery123();
        
        bytes32 qId = oraclize_query("nested", query123);
        
        validId[qId] = true;

        emit logQuery("Oraclize query was sent. Standing by for response.");
    }
    
    /**
     * @dev Get the lottery winner and return their address.
    */
    
    function getWinner(uint randomNumber) private returns (address) {

        uint[] memory ownerTicketAmount = new uint[](buyerPosition.length);
        
        for (uint i = 0; i<buyerPosition.length; i++) {
            ownerTicketAmount[i] = ownerTicketCount[buyerPosition[i]];
        }
        
        uint ticketSum = 0;
        address winnerAddr;

        for (uint p = 0; p<ownerTicketAmount.length; p++) {
            ticketSum = ticketSum.add(ownerTicketAmount[p]);
            if (ticketSum >= randomNumber) {
                winnerAddr = buyerPosition[p];
                break;
            }
        }

        _resetBalances();
        return winnerAddr;
    }
    
    /**
     * @dev Each part of the Oraclize query to be concatenated.
    */
    
    string query1 = "[URL] ['json(https://api.random.org/json-rpc/1/invoke).result.random[\"data\"]', '\\n{\"jsonrpc\": \"2.0\", \"method\": \"generateIntegers\", \"params\": { \"apiKey\": \"${[decrypt] BPDi37UxtLw76aeli6SBqr9TutnyD0rKGFwjEBV8gkmY4FUuJ1mUJYScY+X/U7d/oJIx2uiHI9PbocKe6f4yMrt1+6dz4zR4On/EiL/STvMmBN4S9NGl3peL7p3JrPu1rT0wWhCyOYYtkuNyhOhL+ZTaf84e}\", \"n\": 1, \"min\": 1, \"max\": ";
    string query2;
    string query3 = ", \"replacement\": false${[identity] \"}\"}, \"id\": 1${[identity] \"}\"}']";
    
    string query123;
    
    /**
     * @dev Setters and getters for queries.
    */
    
    function _setQuery2() private {
        query2 = uint2str(ticketsPurchased);
    }
    
    function _setQuery123() private {
        query123 = string(abi.encodePacked(query1, query2, query3));
    }
    
    function getQuery() public view returns(string) {
        return query123;
    }
    /**
     * @dev Withdraw function. Only owner can withdraw contract funds.
    */
    
    function withdraw() public onlyOwner {
        msg.sender.transfer(address(this).balance);
    }
    
    /**
     * @dev Fallback function. Refunds ether to sender unless they are the owner.
    */
    
    function() public payable {
        if (msg.sender != owner) {
            revert();
        }
    }



}