const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployOrioleContracts } = require("./util/deployOrioleContracts")
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrioleStake Contract", function () {

    describe("Deployment", function () {
        it("OrioleStake can mint OrioleTokens", async function () {
            const { addr1, hardhatOrioleToken, hardhatOrioleStake } = await loadFixture(deployOrioleContracts);

            await hardhatOrioleStake.connect(addr1).claimRewards();

            expect(await hardhatOrioleToken.balanceOf(addr1.address)).to.equal(1);
        });

    });
});