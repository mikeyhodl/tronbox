// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './utils/Math.sol';

library B {
  function value() internal pure returns (uint) {
    return Math.double(21);
  }
}
