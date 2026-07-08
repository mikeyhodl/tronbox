// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Exercises every resolver path in a single contract:
//   1. same-directory relative   ./B.sol
//   2. subdirectory relative     ./utils/Math.sol
//   3. scoped npm package        @openzeppelin/contracts/...
//   4. unscoped npm package      sol-mock/Foo.sol
import './B.sol';
import './utils/Math.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import 'sol-mock/Foo.sol'; // trailing comment

contract Main {
  IERC20 public token;

  function setToken(IERC20 t) public {
    token = t;
  }

  function compute(uint v) public pure returns (uint) {
    return Math.double(v) + B.value() + Foo.value();
  }
}
