// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ModelRegistry {
    // 1 Struct for creating model info
    struct Model {
        string name;
        uint256 modelId;
        string ipfsHash;
        uint256 _price;
        address owner;
        bool active;
    }

    // 2    Create a counter to generate unique model IDs
    uint256 public modelCount;
    // 3   map to store the model info dude
    mapping(uint256 => Model) public models;

    // 4   Function to register a model
    function registerModel(
        string memory _name,
        string memory _ipfsHash,
        uint256 _price
    ) public {
        modelCount++;

        models[modelCount] = Model(
            _name,
            modelCount,
            _ipfsHash,
            _price,
            msg.sender,
            true
        );
    }

    // Get model details
    function getModel(uint256 _modelId) public view returns (Model memory) {
        require(_modelId > 0 && _modelId <= modelCount, "Model not found");

        return models[_modelId];
    }

    // Transfer ownership of a model
    function transferModel(uint256 _modelId, address _newOwner) public {
        require(_modelId > 0 && _modelId <= modelCount, "Model not found");

        Model storage model = models[_modelId];

        require(msg.sender == model.owner, "Only owner can transfer");
        require(model.active == true, "Model inactive");

        model.owner = _newOwner;
    }
}