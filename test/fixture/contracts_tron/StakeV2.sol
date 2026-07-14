// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TIP-467 — Stake 2.0
contract StakeV2 {
  function freezeBalanceV2(uint amount, uint resourceType) external {
    freezebalancev2(amount, resourceType);
  }

  function unfreezeBalanceV2(uint amount, uint resourceType) external {
    unfreezebalancev2(amount, resourceType);
  }

  function cancelAllUnfreezeV2() external {
    cancelallunfreezev2();
  }

  function withdrawExpireUnfreeze() external returns (uint) {
    return withdrawexpireunfreeze();
  }

  function delegateResource(uint amount, uint resourceType, address payable receiver) external {
    receiver.delegateResource(amount, resourceType);
  }

  function unDelegateResource(uint amount, uint resourceType, address payable receiver) external {
    receiver.unDelegateResource(amount, resourceType);
  }

  function getChainParameters() external view returns (uint, uint, uint, uint, uint) {
    return (
      chain.totalNetLimit,
      chain.totalNetWeight,
      chain.totalEnergyCurrentLimit,
      chain.totalEnergyWeight,
      chain.unfreezeDelayDays
    );
  }

  function getAvailableUnfreezeV2Size(address target) external view returns (uint) {
    return target.availableUnfreezeV2Size();
  }

  function getUnfreezableBalanceV2(address target, uint resourceType) external view returns (uint) {
    return target.unfreezableBalanceV2(resourceType);
  }

  function getExpireUnfreezeBalanceV2(address target, uint timestamp) external view returns (uint) {
    return target.expireUnfreezeBalanceV2(timestamp);
  }

  function getDelegatableResource(address target, uint resourceType) external view returns (uint) {
    return target.delegatableResource(resourceType);
  }

  function getResourceV2(address target, address from, uint resourceType) external view returns (uint) {
    return target.resourceV2(from, resourceType);
  }

  function checkUnDelegateResource(address target, uint amount, uint resourceType)
    external
    view
    returns (uint, uint, uint)
  {
    return target.checkUnDelegateResource(amount, resourceType);
  }

  function getResourceUsage(address target, uint resourceType) external view returns (uint, uint) {
    return target.resourceUsage(resourceType);
  }

  function getTotalResource(address target, uint resourceType) external view returns (uint) {
    return target.totalResource(resourceType);
  }

  function getTotalDelegatedResource(address from, uint resourceType) external view returns (uint) {
    return from.totalDelegatedResource(resourceType);
  }

  function getTotalAcquiredResource(address target, uint resourceType) external view returns (uint) {
    return target.totalAcquiredResource(resourceType);
  }
}
