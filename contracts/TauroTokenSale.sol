pragma solidity ^0.5.16;
import "./TauroToken.sol";

contract TauroTokenSale {
  address payable admin;
  TauroToken public tokenContract;
  uint256 public tokenPrice;
  uint256 public tokensSold;

  event Sell(address _buyer, uint256 _amount);

  constructor(TauroToken _tokenContract, uint256 _tokenPrice) public {
    admin = msg.sender;
    tokenContract = _tokenContract;
    tokenPrice = _tokenPrice;
  }

  function multiply(uint x, uint y) internal pure returns(uint z) {
    require(y == 0 || (z = x * y) / y == x, 'Failed multiplication');
  }

  function buyTokens(uint _numberOfTokens) public payable {
    // Require that value is equal to tokens
    require(msg.value == multiply(_numberOfTokens, tokenPrice), 'Not enough value to buy tokens');

    // Require the contract has enough tokens
    require(tokenContract.balanceOf(address(this)) >= _numberOfTokens, 'Not enough tokens in contract');

    // Require that a transfer is succesful
    require(tokenContract.transfer(msg.sender, _numberOfTokens), 'Require that a transfer is succesful');

    tokensSold += _numberOfTokens;

    emit Sell(msg.sender, _numberOfTokens);
  }

  function endSale() public {
    require(msg.sender == admin, 'Just admin can end token sale');

    // Return all remaining unsold tokens to admin
    require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))), 'Return all unsold tokens to admin');

    // Destroy contract
    selfdestruct(admin);
  }
}