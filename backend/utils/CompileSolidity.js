const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compileContract() {
  const filePath = path.resolve(__dirname, '../blockchain/WasteContract.sol');
  const source = fs.readFileSync(filePath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'WasteContract.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts['WasteContract.sol']['WasteContract'];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  };
}

module.exports = compileContract;