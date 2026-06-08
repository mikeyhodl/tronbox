// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TIP-135 / TIP-137 / TIP-138 — shielded TRC-20 zero-knowledge proof verification
contract Shielded {
  function mint(
    bytes32[9] memory output,
    bytes32[2] memory bindingSignature,
    uint64 value,
    bytes32 signHash,
    bytes32[33] memory frontier,
    uint256 leafCount
  ) public pure returns (bytes32[] memory) {
    return verifyMintProof(output, bindingSignature, value, signHash, frontier, leafCount);
  }

  function transfer(
    bytes32[10][] memory input,
    bytes32[2][] memory spendAuthoritySignature,
    bytes32[9][] memory output,
    bytes32[2] memory bindingSignature,
    bytes32 signHash,
    uint64 valueBalance,
    bytes32[33] memory frontier,
    uint256 leafCount
  ) public pure returns (bytes32[] memory) {
    return
      verifyTransferProof(
        input,
        spendAuthoritySignature,
        output,
        bindingSignature,
        signHash,
        valueBalance,
        frontier,
        leafCount
      );
  }

  function burn(
    bytes32[10] memory output,
    bytes32[2] memory spendAuthoritySignature,
    uint64 value,
    bytes32[2] memory bindingSignature,
    bytes32 signHash
  ) public pure returns (bool) {
    return verifyBurnProof(output, spendAuthoritySignature, value, bindingSignature, signHash);
  }

  function hash(uint32 level, bytes32 left, bytes32 right) public pure returns (bytes32) {
    return pedersenHash(level, left, right);
  }
}
