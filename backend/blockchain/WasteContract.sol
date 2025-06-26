// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WasteContract {
    address public seller;
    address public buyer;
    string public terms;
    bool public sellerSigned;
    bool public buyerSigned;

    constructor(string memory _terms) {
        terms = _terms;

        // Both roles are initially assigned to deployer (your wallet)
        seller = msg.sender;
        buyer = msg.sender;
    }

    function signAsBuyer() public {
        require(!buyerSigned, "Buyer already signed");
        buyerSigned = true;
    }

    function signAsSeller() public {
        require(!sellerSigned, "Seller already signed");
        sellerSigned = true;
    }

    function isFullySigned() public view returns (bool) {
        return sellerSigned && buyerSigned;
    }
}
