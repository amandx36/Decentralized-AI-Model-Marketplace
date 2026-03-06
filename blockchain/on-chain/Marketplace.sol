// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/ModelRegistry.sol";

contract Marketplace is ModelRegistry {
    // store which buyer purchase which model
    mapping(uint256 => mapping(address => bool)) public buyerAccess;

    // now i am triggering the event the user buys it dude
    // emit when owner buys it
    event PurchaseSucessfull(
        uint256 modelId,
        address buyer,
        uint256 amountPaid
    );

    // deploy time msg.sender mera address tha and  second time purchaseAcess model buy karte time buyer ka msg.sender ho gya !!!

    //  platform wallet to collect 5 percent fee
    address public platFormWallet;

    //    initially i am collecting the ether
    constructor() {
        // replace with the owner of platform 
        platFormWallet = msg.sender;
    }

    // 1. user calls purchaseAccess(modelId) and sends
    function purchaseAccess(uint256 modelId) public payable {
        // 2. get model information from ModelRegistry
        Model memory model = models[modelId];
        // 3. check if model exists and active
        require(model.active == true, "Model is Inactive");
        // 4. check if ETH sent >= model price
        // get the ETH send by buyer is enough or not   obtain by msg.value
        require(msg.value >= model._price, "Not Enough Etherium ");
        // 5. check if buyer already purchased
        require(!buyerAccess[modelId][msg.sender], "Already Purchased");
        // 6. calculate payment split
        uint256 ownerShare = (msg.value * 95) / 100;
        uint256 platformShare = (msg.value * 5) / 100;

        // 7. transfer ETH
        // transfer ether to owner
        payable(model.owner).transfer(ownerShare);

        // send platformShare to platform wallet
        payable(platFormWallet).transfer(platformShare);
        // 8. record buyer access
        buyerAccess[modelId][msg.sender] = true;

        // 9. event emitted when a buyer purchases a model

        emit PurchaseSucessfull(modelId, msg.sender, msg.value);
    }

    // check buyerAccess

    function hasAccess(
        uint256 modelId,
        address user
    ) public view returns (bool) {
        return buyerAccess[modelId][user];
    }
}
