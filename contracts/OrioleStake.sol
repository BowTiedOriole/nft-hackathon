// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IRewardToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

///@title OrioleStake
///@author BowTiedOriole
///@notice This is a simple NFT staking contract that rewards OrioleTokens. Earn one token per day for each NFT you stake
contract OrioleStake is ERC721Holder, Ownable {
    using SafeMath for uint256;

    IRewardToken public rewardsToken;
    IERC721 public nft;

    // One token a day
    uint256 constant stakingTime = 60 * 60 * 24;

    // User Staking Information
    mapping(address => Staker) public stakers;
    struct Staker {
        uint256 stakedTokens;
        mapping(uint256 => uint256) tokenStakingTime;
        uint256 balance;
        uint256 rewardsReleased;
    }
    mapping(uint => address) tokenOwner;

    constructor(IERC721 _nft, IRewardToken _rewardsToken) {
        nft = _nft;
        rewardsToken = _rewardsToken;
    }

    ///@notice Publicly callable stake function
    ///@param _tokenId Id of NFT to stake
    function stake(uint _tokenId) external {
        _stake(msg.sender, _tokenId);
    }

    function _stake(address _address, uint _tokenId) internal {
        require(nft.ownerOf(_tokenId) == _address, "Must own token to stake");
        Staker storage staker = stakers[_address];
        staker.tokenStakingTime[_tokenId] = block.timestamp;
        tokenOwner[_tokenId] = _address;

        // Will need to handle approvals on frontend
        nft.safeTransferFrom(_address, address(this), _tokenId);
        staker.stakedTokens++;
    }

    ///@notice Publicly callable unstake function
    ///@param _tokenId Id of NFT to unstake
    function unstake(uint _tokenId) external {
        _unstake(msg.sender, _tokenId);
    }

    function _unstake(address _address, uint _tokenId) internal {
        require(tokenOwner[_tokenId] == _address, "Must own token to unstake");
        Staker storage staker = stakers[_address];

        delete staker.tokenStakingTime[_tokenId];
        nft.safeTransferFrom(address(this), _address, _tokenId);

        delete tokenOwner[_tokenId];
        staker.stakedTokens--;
    }

    ///@notice Function to calculate and update your rewards
    function updateRewards() external {
        Staker storage staker = stakers[msg.sender];

        uint reward;
        for (uint256 i = 0; i < staker.stakedTokens; i++) {
            uint256 time = staker.tokenStakingTime[i];
            if (block.timestamp > time) {
                reward = (block.timestamp).sub(time).div(stakingTime);
                if (reward > 0) {
                    uint256 remainder = (block.timestamp).sub(time).mod(
                        stakingTime
                    );
                    staker.tokenStakingTime[i] = block.timestamp.sub(remainder);
                    staker.balance += reward;
                }
            }
        }
    }

    ///@notice Function to claim your rewards
    function claimRewards() external {
        address user = msg.sender;
        uint balance = stakers[user].balance;
        require(balance > 0, "No rewards to claim");

        stakers[user].rewardsReleased += balance;
        stakers[user].balance = 0;

        rewardsToken.mint(user, balance * 10**18);
    }

    ///@notice Function to get value of currently claimable rewards
    ///@param _address Address of user to check claimable rewards
    function getBalance(address _address) external view returns (uint) {
        return stakers[_address].balance;
    }
}
