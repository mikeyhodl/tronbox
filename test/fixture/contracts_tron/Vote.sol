// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TIP-271 — vote for SR in a smart contract
contract Vote {
  function voteWitness(address[] calldata srList, uint[] calldata tpList) external {
    vote(srList, tpList);
  }

  function withdrawReward() external returns (uint) {
    return withdrawreward();
  }

  function queryRewardBalance() external view returns (uint) {
    return rewardBalance();
  }

  function isWitness(address sr) external view returns (bool) {
    return isSrCandidate(sr);
  }

  function queryVoteCount(address from, address to) external view returns (uint) {
    return voteCount(from, to);
  }

  function queryTotalVoteCount(address owner) external view returns (uint) {
    return totalVoteCount(owner);
  }

  function queryReceivedVoteCount(address owner) external view returns (uint) {
    return receivedVoteCount(owner);
  }

  function queryUsedVoteCount(address owner) external view returns (uint) {
    return usedVoteCount(owner);
  }
}
