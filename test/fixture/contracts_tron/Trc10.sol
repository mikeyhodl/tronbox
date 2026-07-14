// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TRC-10 token operations in the TVM
contract Trc10 {
  trcToken public tid = 1000001;

  function transfer(address payable to, trcToken id, uint256 amount) external {
    to.transferToken(amount, id);
  }

  function balance(address account, trcToken id) external view returns (uint256) {
    return account.tokenBalance(id);
  }

  function receivePayment() external payable returns (trcToken, uint256) {
    return (msg.tokenid, msg.tokenvalue);
  }
}
