// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ModelRegistry {
    // 1 Struct for creating model info
    struct Model {
        string name;
        uint256 id;
        string ipfsHash;
        address owner;
    }

    // 2    Create a counter to generate unique model IDs
    uint256 public modelCount;
    // 3   map to store the model info dude
    mapping(uint256 => Model) public models;

    // 4   Function to register a model
    function registerModel(
        string memory _name,
        string memory _ipfsHash
    ) public {
        modelCount++;

        models[modelCount] = Model(_name, modelCount, _ipfsHash, msg.sender);
    }

    //  5 Function to retrieve a model
    function getModel(uint256 _modelId) public view returns (Model memory) {
        return models[_modelId];
    }
}
