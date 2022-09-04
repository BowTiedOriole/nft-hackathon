const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("OrioleNFT Contract", function () {
    async function deployNFTContractFixture() {

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const NFT = await ethers.getContractFactory("OrioleNFT");
        const nftName = 'OrioleNFT';
        const nftSymbol = 'ONFT';
        const currentTime = await time.latest();
        const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
        const allowListStartTime = currentTime + ONE_DAY_IN_SECONDS;
        const publicSaleStartTime = allowListStartTime + ONE_DAY_IN_SECONDS;

        const hardhatNFT = await NFT.deploy(nftName, nftSymbol, allowListStartTime, publicSaleStartTime);

        return { hardhatNFT, owner, addr1, addr2, addr3, allowListStartTime, publicSaleStartTime };

    }

    describe("Deployment", function () {
        it("Deployment should assign name and symbol", async function () {
            const { hardhatNFT } = await loadFixture(deployNFTContractFixture);

            expect(await hardhatNFT.name()).to.equal('OrioleNFT');
            expect(await hardhatNFT.symbol()).to.equal('ONFT');
        });
    });

    describe("Allowlist", function () {
        it("Owner can add to allowList", async function () {
            const { hardhatNFT, owner, addr1 } = await loadFixture(deployNFTContractFixture);

            await hardhatNFT.connect(owner).addToAllowList(addr1.address);

            expect(await hardhatNFT.addressAllowed(addr1.address)).to.equal(true);
        });

        it("Owner can remove from allowList", async function () {
            const { hardhatNFT, owner, addr1 } = await loadFixture(deployNFTContractFixture);

            await hardhatNFT.connect(owner).addToAllowList(addr1.address);
            expect(await hardhatNFT.addressAllowed(addr1.address)).to.equal(true);

            await hardhatNFT.connect(owner).removeFromAllowList(addr1.address);
            expect(await hardhatNFT.addressAllowed(addr1.address)).to.equal(false);
        })
    });

    describe("Phases", function () {
        it("Phases return correctly", async function () {
            const { hardhatNFT, allowListStartTime, publicSaleStartTime } = await loadFixture(deployNFTContractFixture);

            // Couldn't figure out how to handle enums other than integers. 0 -> NotStarted, 1 -> Allowlist, 2 -> PublicSale
            expect(await hardhatNFT.currentPhase()).to.equal(0);

            await time.increaseTo(allowListStartTime);
            expect(await hardhatNFT.currentPhase()).to.equal(1);

            await time.increaseTo(publicSaleStartTime);
            expect(await hardhatNFT.currentPhase()).to.equal(2);
        })
    });

    describe("Minting", function () {


        it("Owner can call adminMint and receive one NFT", async function () {
            const { hardhatNFT, owner } = await loadFixture(deployNFTContractFixture);

            await hardhatNFT.connect(owner).adminMint(owner.address);
            expect(await hardhatNFT.balanceOf(owner.address)).to.equal(1);
            expect(await hardhatNFT.ownerOf(0)).to.equal(owner.address);
        });

        it("Non-owner can't call adminMint", async function () {
            const { hardhatNFT, addr1 } = await loadFixture(deployNFTContractFixture);

            await expect(hardhatNFT.connect(addr1).adminMint(addr1.address)).to.be.reverted;
        })

        it("Address on allowList can mint once phase is allowList", async function () {
            const { hardhatNFT, owner, addr1, allowListStartTime } = await loadFixture(deployNFTContractFixture);

            await hardhatNFT.connect(owner).addToAllowList(addr1.address);
            await expect(hardhatNFT.connect(addr1).allowListMint({ value: ethers.utils.parseEther("1") })).to.be.reverted;

            await time.increaseTo(allowListStartTime);
            await hardhatNFT.connect(addr1).allowListMint({ value: ethers.utils.parseEther("1") });
            expect(await hardhatNFT.balanceOf(addr1.address)).to.equal(1);
        });

        it("Address not on allowList can mint once phase is publicSale", async function () {
            const { hardhatNFT, addr2, publicSaleStartTime } = await loadFixture(deployNFTContractFixture);

            await expect(hardhatNFT.connect(addr2).allowListMint({ value: ethers.utils.parseEther("1") })).to.be.reverted;

            await time.increaseTo(publicSaleStartTime);
            await hardhatNFT.connect(addr2).publicSaleMint({ value: ethers.utils.parseEther("1") });
            expect(await hardhatNFT.balanceOf(addr2.address)).to.equal(1);
        });
    });

    describe("Raffle", function () {

        it("Address can enter into raffle. Will win if only entry", async function () {
            const { hardhatNFT, owner, addr1 } = await loadFixture(deployNFTContractFixture);

            await hardhatNFT.connect(addr1).enterRaffle(addr1.address, { value: ethers.utils.parseEther(".1") });
            await hardhatNFT.connect(owner).executeRaffle();

            expect(await hardhatNFT.balanceOf(addr1.address)).to.equal(1);
        })

        it("Emits event upon raffle execution", async function () {
            const { hardhatNFT, owner, addr1, addr2, addr3 } = await loadFixture(deployNFTContractFixture);

            await hardhatNFT.connect(addr1).enterRaffle(addr1.address, { value: ethers.utils.parseEther(".1") });
            await hardhatNFT.connect(addr2).enterRaffle(addr2.address, { value: ethers.utils.parseEther(".1") });
            await hardhatNFT.connect(addr3).enterRaffle(addr3.address, { value: ethers.utils.parseEther(".1") });

            await expect(await hardhatNFT.connect(owner).executeRaffle()).to.emit(hardhatNFT, "Raffle");
            expect(await hardhatNFT.ownerOf(0)).to.not.be.null;
        })
    });

});