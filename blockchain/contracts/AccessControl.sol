// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AccessControl {

    // 1 creating roles for users
    
    enum Roles {
        NONE,
        VIEWER,
        ADMIN,
        EDITOR
    }

    // 2 owner of the contract
    // the developer who deploys contract becomes owner
    address public owner;


    // 3 mapping to store roles with wallet address
    
    mapping(address => Roles) public Authorization;


    // 4  runs only once during deployment
    // msg.sender = wallet that deploys the contract
    // so developer becomes owner
    constructor(){
        owner = msg.sender;
    }


    // 5 function to assign role to a user
    // only owner can assign roles
    function accessControl(Roles _role, address _user) public returns(bool){

        // checking if caller is owner or not
        require(msg.sender == owner , "You are not Owner , Permission denied");

        // assigning role to the user
        Authorization[_user] = _role;

        // successfully done  
        return true;
    }


    // 6 function to check role of a user
    // backend / frontend 
    function checkAccess(address _user) public view returns(Roles){

        // return role 
        return Authorization[_user];
    }

}