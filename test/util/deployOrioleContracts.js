const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function deployOrioleContracts() {
    const [owner, addr1] = await ethers.getSigners();

    const OrioleToken = await ethers.getContractFactory("OrioleToken");
    const OrioleStake = await ethers.getContractFactory("OrioleStake");
    const OrioleNFT = await ethers.getContractFactory("OrioleNFT");

    const nftName = 'OrioleNFT';
    const nftSymbol = 'ONFT';
    const currentTime = await time.latest();
    const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
    const allowListStartTime = currentTime + ONE_DAY_IN_SECONDS;
    const publicSaleStartTime = allowListStartTime + ONE_DAY_IN_SECONDS;

    const hardhatOrioleNFT = await OrioleNFT.deploy(nftName, nftSymbol, allowListStartTime, publicSaleStartTime);
    const hardhatOrioleToken = await OrioleToken.deploy();
    const hardhatOrioleStake = await OrioleStake.deploy(hardhatOrioleNFT.address, hardhatOrioleToken.address);


    // Grant OrioleStake MINTER_ROLE
    await hardhatOrioleToken.connect(owner).grantRole(hardhatOrioleToken.MINTER_ROLE(), hardhatOrioleStake.address)
    return { owner, addr1, hardhatOrioleNFT, hardhatOrioleToken, hardhatOrioleStake }
}

module.exports = { deployOrioleContracts };