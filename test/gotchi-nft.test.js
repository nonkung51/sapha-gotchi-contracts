const { expect } = require("chai");

describe("Gotchi NFT", function () {
	let GotchiNFT;
	let gotchiNft;

	let alice;
	let bob;

	beforeEach(async () => {
		[alice, bob] = await ethers.getSigners();

		GotchiNFT = await ethers.getContractFactory("GotchiNFT");
		gotchiNft = await GotchiNFT.deploy();
		await gotchiNft.deployed();
	});

	it("Should be able to propose for new Gotchi", async function () {
		expect(await gotchiNft.propose(0, "ipfs://somewhere.jpg"))
			.to.emit(gotchiNft, "NewGotchiPropose")
			.withArgs(0, "ipfs://somewhere.jpg", 1);
	});

	it("Should be able to confirm after propose Gotchi", async function () {
		await gotchiNft.propose(0, "ipfs://somewhere.jpg");

		expect(await gotchiNft.validate(1, true))
			.to.emit(gotchiNft, "NewGotchiValidated")
			.withArgs(1, true);
	});

	it("Should be able to reject after propose Gotchi", async function () {
		await gotchiNft.propose(0, "ipfs://somewhere.jpg");

		expect(await gotchiNft.validate(1, false))
			.to.emit(gotchiNft, "NewGotchiValidated")
			.withArgs(1, false);

		// Check if burn
		await expect(gotchiNft.ownerOf(1)).to.be.revertedWith(
			"ERC721: owner query for nonexistent token"
		);
	});

	it("Should work when set validator", async function () {
		await gotchiNft.setValidator(alice.address);
		await gotchiNft.propose(0, "ipfs://somewhere.jpg");

		expect(await gotchiNft.connect(alice).validate(1, false))
			.to.emit(gotchiNft, "NewGotchiValidated")
			.withArgs(1, false);

		// Check if burn
		await expect(gotchiNft.ownerOf(1)).to.be.revertedWith(
			"ERC721: owner query for nonexistent token"
		);

		await gotchiNft.propose(0, "ipfs://somewhere.jpg");
		await expect(gotchiNft.connect(bob).validate(2, false)).to.be.reverted;
		await expect(gotchiNft.connect(bob).setValidator(bob.address)).to.be.reverted;
	});
});
