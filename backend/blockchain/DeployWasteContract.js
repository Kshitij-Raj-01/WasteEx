const { ethers } = require("ethers");
require("dotenv").config();

// Initialize blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load ABI and Bytecode
const contractPath = require("../blockchain/WasteContractAbi.json");
const abi = contractPath.abi;
const bytecode = contractPath.bytecode;

/**
 * Deploy the WasteContract smart contract.
 * @param {string} termsJson - The contract terms in JSON string format.
 * @returns {Object} address and transaction hash.
 */
const deployContract = async (termsJson) => {
  const ContractFactory = new ethers.ContractFactory(abi, bytecode, wallet);

  // 🧬 Deploying the contract with terms, seller, and buyer
  const contract = await ContractFactory.deploy(termsJson);

  // ⏳ Wait for deployment confirmation
  await contract.waitForDeployment();

  return {
    address: contract.target,
    transactionHash: contract.deploymentTransaction().hash,
  };
};

module.exports = deployContract;
