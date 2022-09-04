// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

///@title OrioleNFT
///@author BowTiedOriole
///@notice This is a simple NFT contract with a raffle and a phased release
contract OrioleNFT is ERC721, Ownable {
    event Withdrawal(address indexed withdrawer, uint256 amount);
    event Raffle(address indexed winner, uint256 tokenId);

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    uint256 public mintPrice = 1 ether;
    uint256 public rafflePrice = .1 ether;
    uint256 public allowListStartTime;
    uint256 public publicSaleStartTime;

    mapping(address => bool) private allowList;
    address[] raffleEntries;

    enum Phase {
        NotStarted,
        Allowlist,
        PublicSale
    }

    modifier atPhase(Phase _phase) {
        if (currentPhase() != _phase) {
            revert();
        }
        _;
    }

    ///@notice Initialize the allowList and publicSale start times. These can't be changed
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _allowListStartTime,
        uint256 _publicSaleStartTime
    ) ERC721(_name, _symbol) {
        allowListStartTime = _allowListStartTime;
        publicSaleStartTime = _publicSaleStartTime;
    }

    ///@notice Owner can mint NFT anytime, free of charge
    function adminMint(address _address) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_address, tokenId);
    }

    ///@notice During allowList phase, addresses on allowList can mint the NFT
    function allowListMint() external payable atPhase(Phase.Allowlist) {
        require(allowList[msg.sender] == true, "Address not in allowList");
        require(msg.value == mintPrice, "Invalid transaction value");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    ///@notice After allowList phase, any address can mint the NFT
    function publicSaleMint() external payable atPhase(Phase.PublicSale) {
        require(msg.value == mintPrice, "Invalid transaction value");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    ///@notice Enter address into raffle
    ///@param _address Address to enter into raffle
    function enterRaffle(address _address) external payable {
        require(msg.value == rafflePrice, "Invalid transaction value");
        raffleEntries.push(_address);
    }

    ///@notice send full contract balance to owner
    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        payable(msg.sender).transfer(bal);
        emit Withdrawal(msg.sender, bal);
    }

    ///@notice Set price for the NFT
    ///@param _price New mint price of NFT
    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    ///@notice Add address to allowList
    ///@param _address Address to add to the allowList
    function addToAllowList(address _address) external onlyOwner {
        allowList[_address] = true;
    }

    ///@notice Remove address from allowList
    ///@param _address Address to remove
    function removeFromAllowList(address _address) external onlyOwner {
        allowList[_address] = false;
    }

    ///@notice Executes the raffle
    function executeRaffle() external onlyOwner {
        address winner = raffleEntries[getRandom(raffleEntries.length)];
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(winner, tokenId);
        emit Raffle(winner, tokenId);
    }

    ///@notice Returns true if provided address is on allowList
    ///@param _address Address of user to check
    function addressAllowed(address _address) external view returns (bool) {
        return allowList[_address];
    }

    ///@notice Returns "random" element of array
    ///@param _length Length of the array
    function getRandom(uint256 _length) private view returns (uint256) {
        // I know this isn't truly random. But executeRaffle is onlyOwner so prolly ok
        return block.timestamp % _length;
    }

    /// @notice Returns the current phase
    /// @return phase Current phase
    function currentPhase() public view returns (Phase) {
        if (block.timestamp < allowListStartTime) {
            return Phase.NotStarted;
        } else if (
            block.timestamp >= allowListStartTime &&
            block.timestamp < publicSaleStartTime
        ) {
            return Phase.Allowlist;
        }
        return Phase.PublicSale;
    }
}
