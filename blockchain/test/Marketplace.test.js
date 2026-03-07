const { expect } = require("chai");
const { ethers } = require("hardhat");




describe("Marketplace Contract", function () {


let marketplace;
let owner;
let buyer;

beforeEach(async function () {

    // get blockchain accounts
    [owner, buyer] = await ethers.getSigners();

    // load compiled Marketplace contract
    const Marketplace = await ethers.getContractFactory("Marketplace");

    // deploy contract to local blockchain
    marketplace = await Marketplace.deploy();

    // wait until deployment is confirmed
    await marketplace.deployed();

    /*
    register a model first
    because buyers can only purchase
    existing models
    */

    await marketplace.registerModel(
        "GPT Model",
        "ipfsHash123",
        ethers.utils.parseEther("1")
    );

});

// TEST CASE 03  BUYER PURCHASE MODEL 


it("Should allow buyer to purchase model access", async function () {

    // buyer purchases the model by sending ETH
    await marketplace.connect(buyer).purchaseAccess(1, {
        value: ethers.utils.parseEther("1")
    });

    // check if buyer now has access
    const access = await marketplace.hasAccess(1, buyer.address);

    expect(access).to.equal(true);

});


// TEST CASE 04 PREVENT FROM DOUBLE PURCHASE 

it("Should prevent buyer from purchasing twice", async function () {

    // first purchase
    await marketplace.connect(buyer).purchaseAccess(1, {
        value: ethers.utils.parseEther("1")
    });

    // second purchase should fail
    await expect(
        marketplace.connect(buyer).purchaseAccess(1, {
            value: ethers.utils.parseEther("1")
        })
    ).to.be.revertedWith("Already Purchased");

});


});
