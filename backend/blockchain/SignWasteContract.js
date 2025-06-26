const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load ABI only (no need for bytecode here)
const contractPath = path.resolve(__dirname, "./WasteContractAbi.json");
const { abi } = JSON.parse(fs.readFileSync(contractPath, "utf8"));

const signContractOnChain = async (contractAddress, signerRole) => {
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Call the corresponding function based on role
  if (signerRole === "seller") {
    const tx = await contract.signAsSeller();
    await tx.wait();
    return tx.hash;
  } else if (signerRole === "buyer") {
    const tx = await contract.signAsBuyer();
    await tx.wait();
    return tx.hash;
  } else {
    throw new Error("Invalid signer role");
  }
};

module.exports = signContractOnChain;
