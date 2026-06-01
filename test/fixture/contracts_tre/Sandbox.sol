// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Sandbox {
  mapping(address => uint256) values;
  address owner;

  event ValueSent(address indexed from, address indexed to, uint256 value);

  constructor(uint256 initialValue) {
    owner = msg.sender;
    values[msg.sender] = initialValue;
  }

  function getOwner() public view returns (address) {
    return owner;
  }

  function getMsgSender() public view returns (address sender) {
    sender = msg.sender;
  }

  function getTrxBalance(address addr) public view returns (uint256 balance) {
    balance = addr.balance;
  }

  function getBlockNumber() public view returns (uint256 blockNumber) {
    blockNumber = block.number;
  }

  function getValue(address addr) public view returns (uint256) {
    return values[addr];
  }

  function send(address recipient, uint256 amount) public returns (bool ok) {
    if (values[msg.sender] < amount) return false;
    values[msg.sender] -= amount;
    values[recipient] += amount;
    emit ValueSent(msg.sender, recipient, amount);
    return true;
  }
}
