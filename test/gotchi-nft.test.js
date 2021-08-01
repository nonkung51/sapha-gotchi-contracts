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

	it("Should be able to burn Gotchi", async function () {
		await gotchiNft.connect(bob).propose(0, "ipfs://somewhere.jpg");
		await gotchiNft.validate(1, true);

		await gotchiNft.connect(bob).burn(1);
		
		// Check if burn
		await expect(gotchiNft.ownerOf(1)).to.be.revertedWith(
			"ERC721: owner query for nonexistent token"
		);
	});

	it("Should produce rarity with right ratio", async function () {
		for (let i = 0; i < 100; i++) {
			await gotchiNft.propose(0, "ipfs://somewhere.jpg");
		}
		let rarity = [0, 0, 0];

		for (let j = 1; j < 101; j++) {
			rarity[(await gotchiNft.getGotchiInfo(j))[1]] += 1;
		}

		// tolerence for 30% error
		expect(rarity[0] / 100).to.be.closeTo(0.6, 0.18);
		expect(rarity[1] / 100).to.be.closeTo(0.3, 0.09);
		expect(rarity[2] / 100).to.be.closeTo(0.1, 0.03);
	});

	it("Should be able to confirm after propose Gotchi", async function () {
		await gotchiNft.propose(0, "ipfs://somewhere.jpg");

		expect(await gotchiNft.validate(1, true))
			.to.emit(gotchiNft, "NewGotchiValidated")
			.withArgs(1, true);
	});

	it("Should be able to take SinoVac", async function () {
		await gotchiNft.propose(0, "ipfs://somewhere.jpg");
		await gotchiNft.validate(1, true);

		await gotchiNft.inject(1);
		await expect(gotchiNft.inject(1)).to.be.reverted;

		// One dose
		expect((await gotchiNft.getGotchiInfo(1))[3]).to.be.equal(1);
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
		await expect(gotchiNft.connect(bob).setValidator(bob.address)).to.be
			.reverted;
	});
});
