// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRewardToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract OrioleStake is ERC721Holder, Ownable {
    IRewardToken public rewardsToken;
    IERC721 public nft;

    constructor(IERC721 _nft, IRewardToken _rewardsToken) {
        nft = _nft;
        rewardsToken = _rewardsToken;
    }

    function claimRewards() external {
        rewardsToken.mint(msg.sender, 1);
    }
}
