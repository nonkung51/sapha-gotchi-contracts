//SPDX-License-Identifier: Unlicense
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract GotchiNFT is ERC721 {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    enum MintingStatus {
        PENDING,
        MINTED
    }

    enum Rarity {
        COMMON,
        RARE,
        EPIC
    }

    struct GotchiStatus {
        MintingStatus mintingStatus;
        Rarity rarity;
        uint256 untilAbleToInject;
        uint256 sinovacTaked;
        uint256 power;
    }

    // Modifier
    modifier onlyValidator() {
        if (validator != address(0)) {
            require(msg.sender == validator, "Only allow validator");
        }
        _;
    }

    // Events
    event NewGotchiPropose(uint8 role, string tokenURI, uint256 id);
    event NewGotchiValidated(uint256 id, bool status);

    // Constant
    uint256 constant timeBetweenShots = 1 minutes;

    // State Variables
    Counters.Counter private _tokenIds;
    mapping(uint256 => GotchiStatus) gotchiStatus;
    address public validator;

    // Initialized
    constructor() public ERC721("Sapha-Gotchi NFT", "Gotchi") {}

    // Functions
    function propose(uint8 role, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        // create new gotchi status set minting status to pending
        gotchiStatus[newItemId] = GotchiStatus(
            MintingStatus.PENDING,
            getGotchiRarity(uint256(msg.sender)),
            block.timestamp,
            0,
            0
        );

        emit NewGotchiPropose(role, tokenURI, newItemId);

        return newItemId;
    }

    function validate(uint256 id, bool status) public onlyValidator {
        require(
            gotchiStatus[id].mintingStatus != MintingStatus.MINTED,
            "Already validated!"
        );
        require(_exists(id), "Gotchi is not exists");

        if (status) {
            // set status to minted
            gotchiStatus[id].mintingStatus = MintingStatus.MINTED;
        } else {
            // burn that id
            _burn(id);
        }

        emit NewGotchiValidated(id, status);
    }

    function setValidator(address _validator) public onlyValidator {
        validator = _validator;
    }

    // Game functions
    function getGotchiInfo(uint256 id)
        public
        view
        returns (GotchiStatus memory)
    {
        require(_exists(id), "Gotchi is not exists");
        return gotchiStatus[id];
    }

    function randomNumber(uint256 seed, uint256 range)
        internal
        view
        returns (uint256)
    {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, block.difficulty, seed)
                )
            ).mod(range);
    }

    function getGotchiRarity(uint256 seed) internal view returns (Rarity) {
        uint256 rand = randomNumber(seed, uint256(1001));

        if (0 <= rand && rand <= 100) {
            return Rarity.EPIC;
        } else if (100 < rand && rand <= 400) {
            return Rarity.RARE;
        } else {
            return Rarity.COMMON;
        }
    }

    function inject(uint256 id) public {
        GotchiStatus memory gotchiInfo = gotchiStatus[id];

        //TODO: Check for owner
        require(
            ownerOf(id) == msg.sender,
            "Not your Gotchi!"
        );
        require(
            gotchiInfo.mintingStatus == MintingStatus.MINTED,
            "Gotchi is not minted"
        );
        require(
            block.timestamp >= gotchiInfo.untilAbleToInject,
            "Not ready for Sinovac"
        );

        gotchiInfo.untilAbleToInject = block.timestamp.add(timeBetweenShots);
        gotchiInfo.sinovacTaked = gotchiInfo.sinovacTaked.add(1);
        gotchiInfo.power = gotchiInfo.power.add(calculatePowerUp(id));

        if (gotchiInfo.power > 250) {
            gotchiInfo.power = 250;
        }

        gotchiStatus[id] = gotchiInfo;
    }

    function calculatePowerUp(uint256 id) internal view returns (uint256) {
        GotchiStatus memory gotchiInfo = gotchiStatus[id];

        uint256 powerup = randomNumber(uint256(msg.sender), 11);

        if (gotchiInfo.rarity == Rarity.EPIC) {
            powerup = powerup.add(5);
        } else if (gotchiInfo.rarity == Rarity.RARE) {
            powerup = powerup.add(2);
        }

        if (powerup < 10) {
            return powerup;
        } else {
            return 10;
        }
    }
}
