// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TIP-157 — TVM freeze instructions
contract Freeze {
  function freezeBalance(address payable receiver, uint amount, uint res) external payable {
    receiver.freeze(amount, res);
  }

  function unfreezeBalance(address payable receiver, uint res) external {
    receiver.unfreeze(res);
  }

  function queryExpireTime(address payable target, uint res) external view returns (uint) {
    return target.freezeExpireTime(res);
  }
}
