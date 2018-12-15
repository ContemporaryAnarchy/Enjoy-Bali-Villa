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
    
    uint public randomNumber = 0;
    uint constant gasLimitForOraclize = 175000;
    uint public softCap;
    uint public hardCap;
    uint public villaPrice;
    uint public ticketPrice;
    uint public startTime;
    uint public ticketsPurchased;
    
    bool isInitialized = false;
    
    mapping (address => uint) ownerTicketCount;
    mapping (string => address) positionToOwner;
    mapping(bytes32 => bool) validId;
    
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
        uint villaPrice,
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
        oraclize_setCustomGasPrice(1000000000 wei);
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
    }

    /**
    *   @dev Helper/Getter functions
    */

    function getTicketAmount(address _owner) public view returns (uint) {
        return (ownerTicketCount[_owner]);
    }

    function getbuyerPositions() public view returns (address[] memory) {
        return buyerPosition;
    }
    
    function getRandomNumber() public view returns (uint) {
        return randomNumber;
    }
    
    /**
    *   @dev Initialize the lottery with the appropriate values. Only available to contract owner.
     */

    function initialize(uint256 soft, uint256 hard, uint256 villa, uint ticket, uint256 time) public onlyOwner {
        require(!isInitialized, "Lottery is already initialized!");
        isInitialized = true;
        
        softCap = soft;
        hardCap = hard;
        villaPrice = villa;
        ticketPrice = ticket;
        startTime = now + time;

        emit lottoInitialized(softCap, hardCap, villaPrice, ticketPrice, startTime);
        
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
        
        randomNumber = parseInt(result);
        
        emit logNumberReceived(randomNumber);
        
        validId[qId] = false;
    }
    
    /**
     * @dev Oraclize query to random.org. Fetches one random number between 0 and the
     * total amount of tickets purchased. Returns the value in the callback above and calls the winner. 
    */
    
    function queryRandomNumber() public onlyOwner {
        require(isInitialized, "Lottery is not initialized");
        isInitialized = false;
        
        setQuery2();
        setQuery123();
        
        bytes32 qId = oraclize_query("nested", query123);
        
        validId[qId] = true;
        
        emit logQuery("Oraclize query was sent. Standing by for response.");
    }
    
    /**
     * @dev Get the lottery winner and return their address.
    */
    
    function getWinner() public view onlyOwner returns (address) {
        require(randomNumber != 0, "Random number not yet received!");
        
        uint[] memory ownerTicketAmount = new uint[](buyerPosition.length);
        
        for (uint i = 0; i<buyerPosition.length; i++) {
            ownerTicketAmount[i] = ownerTicketCount[buyerPosition[i]];
        }
        
        uint ticketSum = 0;
        
        for (uint p = 0; p<ownerTicketAmount.length; p++) {
            ticketSum = ticketSum.add(ownerTicketAmount[p]);
            if (ticketSum >= randomNumber) {
                return buyerPosition[p];
            }
        }
    }
    
    /**
     * @dev Each part of the Oraclize query to be concatenated.
    */
    
    string query1 = "[URL] ['json(https://api.random.org/json-rpc/1/invoke).result.random[\"data\"]', '\\n{\"jsonrpc\": \"2.0\", \"method\": \"generateIntegers\", \"params\": { \"apiKey\": \"${[decrypt] BDgBuYVTvv7e6Sg9G/hdGCNokJ1Lw34gMQXbCbHffM78wyLLriWwSLX95KSjHUfInP7cTMmHC3ok2XZBd0kSEy3JvdrcqF56Gm9WcYwZ9XkGgL2L3r5s2j3zadHELxrVg7+wWvz+/T2PCy830/BQZ87Lv4Cs}\", \"n\": 1, \"min\": 1, \"max\": ";
    string query2;
    string query3 = ", \"replacement\": false${[identity] \"}\"}, \"id\": 1${[identity] \"}\"}']";
    
    string query123;
    
    /**
     * @dev Setters and getters for queries.
    */
    
    function setQuery2() private {
        query2 = uint2str(ticketsPurchased);
    }
    
    function setQuery123() private {
        query123 = string(abi.encodePacked(query1, query2, query3));
    }
    
    function getQuery() public view returns(string) {
        return query123;
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