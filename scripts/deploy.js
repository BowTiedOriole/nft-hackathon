const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const OrioleToken = await ethers.getContractFactory("OrioleToken");
    const OrioleStake = await ethers.getContractFactory("OrioleStake");
    const OrioleNFT = await ethers.getContractFactory("OrioleNFT");

    const nftName = 'OrioleNFT';
    const nftSymbol = 'ONFT';
    const currentTime = Date.now();
    const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
    const allowListStartTime = currentTime + ONE_DAY_IN_SECONDS;
    const publicSaleStartTime = allowListStartTime + ONE_DAY_IN_SECONDS;

    const OrioleNFTContract = await OrioleNFT.deploy(nftName, nftSymbol, allowListStartTime, publicSaleStartTime);
    const OrioleTokenContract = await OrioleToken.deploy();
    const OrioleStakeContract = await OrioleStake.deploy(OrioleNFTContract.address, OrioleTokenContract.address);


    // Grant OrioleStake MINTER_ROLE
    await OrioleTokenContract.connect(deployer).grantRole(OrioleTokenContract.MINTER_ROLE(), OrioleStakeContract.address)

    console.log("NFT address: ", OrioleNFTContract.address)
    console.log("Token address: ", OrioleTokenContract.address)
    console.log("Stake address: ", OrioleStakeContract.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
