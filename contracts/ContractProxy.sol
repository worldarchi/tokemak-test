//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ContractProxy {

  bytes32 internal constant _IMPLEMENTATION_SLOT = 0x6c0a2267534ef664ee5af3a9ade703b75f00915c0fc78003e257b57ceef042e3;

  address public governance;

  mapping (address => bool) public tokens;

  modifier tokenListed(address _token) {
    require(tokens[_token], "token is not listed");
    _;
  }

  modifier onlyGovernance() {
    require(msg.sender == governance, "Not governance");
    _;
  }

  constructor(address _implementation) public {
    assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256("eip1967.ContractProxy.implementation")) - 1));
    _setImplementation(_implementation);
    governance = msg.sender;
  }

  function addToken(address _token) public onlyGovernance {
    require(_token != address(0), "token must be defined");
    tokens[_token] = true;
  }

  function removeToken(address _token) public onlyGovernance {
    require(_token != address(0), "token must be defined");
    tokens[_token] = false;
  }

  function setAddress(bytes32 slot, address _address) internal {
    assembly {
      sstore(slot, _address)
    }
  }

  function getAddress(bytes32 slot) internal view returns (address str) {
    assembly {
      str := sload(slot)
    }
  }

  function _setImplementation(address _address) internal {
    setAddress(_IMPLEMENTATION_SLOT, _address);
  }

  function implementation() public view returns (address) {
    return getAddress(_IMPLEMENTATION_SLOT);
  }

  function transfer(address token, address recipent, uint256 amount) public tokenListed(token) onlyGovernance returns (bool) {
    (bool success, ) = implementation().delegatecall(
      abi.encodeWithSignature("transfer(address,address,uint256)", token, recipent, amount)
    );
    return success;
  }
}
