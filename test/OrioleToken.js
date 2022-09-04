const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deployOrioleContracts } = require("./util/deployOrioleContracts")
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrioleToken Contract", function () {
    describe("Deployment", function () {
        it("OrioleStake has MINTER_ROLE", async function () {
            // This fixture grants OrioleStake the MINTER_ROLE
            const { hardhatOrioleToken, hardhatOrioleStake } = await loadFixture(deployOrioleContracts);

            expect(await hardhatOrioleToken.hasRole(hardhatOrioleToken.MINTER_ROLE(), hardhatOrioleStake.address)).to.equal(true);
        });

    });
});