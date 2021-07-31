const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(deployer.address);
  
	const GotchiNFT = await hre.ethers.getContractFactory("GotchiNFT");
	const gotchiNft = await GotchiNFT.deploy();

	await gotchiNft.deployed();

	console.log("GotchiNFT deployed to:", gotchiNft.address);

	await hre.run("verify:verify", {
		address: gotchiNft.address,
		constructorArguments: [],
	});
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
