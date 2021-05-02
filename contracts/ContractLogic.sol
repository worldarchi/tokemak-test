//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract ContractLogic {
  using SafeERC20 for IERC20;

  event Transfer(address token, address sender, address recipent, uint256 amount);

  function transfer(address token, address recipent, uint256 amount) public {
    require(amount > 0, "Cannot transfer 0");
    require(recipent != address(0), "recipent must be defined");
    require(token != address(0), "token must be defined");

    IERC20(token).safeTransferFrom(msg.sender, recipent, amount);

    emit Transfer(token, msg.sender, recipent, amount);
  }
}