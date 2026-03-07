// testing ModelRegister smart contract

const { expect } = require("chai");
const { ethers } = require("hardhat");

// grouping all tests for ModelRegistry contract
describe("ModelRegistry Contract", function(){

// beforeEach() testing framework runs this block before every test
// it deploys a fresh contract every time

beforeEach(async function () {


// get blockchain account  ,  owner and user1
[owner , user1] = await ethers.getSigners();

// load compiled smart contract 
const ModelRegistry = await ethers.getContractFactory("ModelRegistry")

// deploy the model in local blockchain 
registry = await ModelRegistry.deploy();

// wait until deployment is confirmed 
await registry.deployed();


});

//   TEST CASE 01

it("Should register a model",async function(){


// calling register Model
await registry.registerModel("Ai Model ","x0x121",100);

// fetching model info 
const model  = await  registry.getModel(1);

// check the model name 
expect(model.name).to.equal("Ai Model ");

// check the model owner
expect(model.owner).to.equal(owner.address);

// check teh model active status 
expect(model.active).to.equal(true);


})

//                      TEST CASE 02

it ("SHOULD TRANFER OWNER-SHIP DUDE ", async function(){


// register model 
await registry.registerModel("AI Model","ipfsHash", 100);

// transfer the owner ship dude 
await registry.transferModel(1,user1.address);

// fetch again the model 
const model = await registry.getModel(1);

// check owner dude 
expect(model.owner).to.equal(user1.address)


});

});
