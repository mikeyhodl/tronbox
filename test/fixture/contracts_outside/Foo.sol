// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import '../shared_lib/Lib.sol';

contract Foo {
  function plus(uint a, uint b) public pure returns (uint) {
    return Lib.add(a, b);
  }
}
