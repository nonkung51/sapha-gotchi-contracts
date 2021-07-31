//SPDX-License-Identifier: Unlicense
pragma solidity 0.6.12;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GotchiNFT is ERC721 {
    using Counters for Counters.Counter;

    enum GotchiStatus {
        PENDING,
        MINTED
    }

    // Events
    event NewGotchiPropose(uint8 role, string tokenURI, uint256 id);
    event NewGotchiValidated(uint256 id, bool status);

    // State Variables
    Counters.Counter private _tokenIds;
    mapping(uint256 => GotchiStatus) gotchiStatus;

    // Initialized
    constructor() public ERC721("Sapha-Gotchi NFT", "Gotchi") {}

    // Functions
    function propose(uint8 role, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        // Set status of Gotchi to pending
        gotchiStatus[newItemId] = GotchiStatus.PENDING;

        emit NewGotchiPropose(role, tokenURI, newItemId);

        return newItemId;
    }

    function validate(uint256 id, bool status) public {
        if (status) {
            // set status to minted
            gotchiStatus[id] = GotchiStatus.MINTED;
        } else {
            // burn that id
            _burn(id);
        }

        emit NewGotchiValidated(id, status);
    }
}