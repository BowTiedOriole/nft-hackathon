const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployOrioleContracts } = require("./util/deployOrioleContracts")
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrioleStake Contract", function () {

    describe("Staking", function () {
        it("User can stake and unstake nft", async function () {
            const { owner, addr1, hardhatOrioleNFT, hardhatOrioleStake } = await loadFixture(deployOrioleContracts);

            await hardhatOrioleNFT.connect(owner).adminMint(addr1.address);
            expect(await hardhatOrioleNFT.ownerOf(0)).to.equal(addr1.address);

            await hardhatOrioleNFT.connect(addr1).approve(hardhatOrioleStake.address, 0);
            await hardhatOrioleStake.connect(addr1).stake(0);
            expect(await hardhatOrioleNFT.ownerOf(0)).to.equal(hardhatOrioleStake.address);

            await hardhatOrioleStake.connect(addr1).unstake(0);
            expect(await hardhatOrioleNFT.ownerOf(0)).to.equal(addr1.address);
        });
    });

    describe("Rewards", function () {
        it("One stake for 180 seconds yields one token", async function () {
            const { owner, addr1, hardhatOrioleNFT, hardhatOrioleStake, hardhatOrioleToken } = await loadFixture(deployOrioleContracts);

            await hardhatOrioleNFT.connect(owner).adminMint(addr1.address);
            await hardhatOrioleNFT.connect(addr1).approve(hardhatOrioleStake.address, 0);
            await hardhatOrioleStake.connect(addr1).stake(0);
            await time.increase(180);

            await hardhatOrioleStake.connect(addr1).updateRewards();
            expect(await hardhatOrioleStake.getBalance(addr1.address)).to.equal(1);

            await hardhatOrioleStake.connect(addr1).claimRewards();

            expect(await hardhatOrioleToken.balanceOf(addr1.address)).to.equal(1);
        });
    });
});