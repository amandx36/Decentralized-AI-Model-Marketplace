// deploy only the marketPlace as it inherit all teh file dude

const hre = require("hardhat")

// main async function
async function main() {

// 1 start the deployemt script
console.log("Starting the deployment script")

// 2 getting account
// getSigners() returns available blockchain accounts
const [deployer] = await hre.ethers.getSigners();

// 3 printing which wallet is deploying the contract
console.log("Deploying the constract using account :) ", deployer.address);

// 4 fetching balance of deployer
const balance = await hre.ethers.provider.getBalance(deployer.address);

// converting wei to ether
console.log("Account Balance :) ", hre.ethers.utils.formatEther(balance), " ETH")

//  5 load compiled contract
const marketPlace = await hre.ethers.getContractFactory("Marketplace")

// 6 deploy the contract
const marketplace = await marketPlace.deploy()

// 6 wait for deployment dude
await marketplace.deployed();

const address = marketplace.address;

// 7 print the contract address
console.log("Marketpalce deployed to ", address);

// now dude error handling dude

}

main().catch((error)=>{
console.error(error);
process.exitCode =  1 ;
});
