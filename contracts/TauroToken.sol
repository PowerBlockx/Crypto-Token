pragma solidity ^0.5.16;

contract TauroToken {
  string public name = 'Berry';
  string public symbol = 'BER';
  string public standard = 'Berry Token v1.0';
  uint256 public totalSupply;

  event Transfer(
    address indexed _from,
    address indexed _to,
    uint256 _value
  );

  event Approval(
    address indexed _owner,
    address indexed _spender,
    uint256 _value
  );

  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  constructor(uint256 _initialSupply) public {
    //  alocate initial supply
    balanceOf[msg.sender] = _initialSupply;
    totalSupply = _initialSupply;
  }

  // Transfer
  function transfer(address _to, uint256 _value) public returns(bool success) {
    // Execption if account doesn't have enough funds
    require(balanceOf[msg.sender] >= _value, "Invalid amount");
    // Transfer the balance
    balanceOf[msg.sender] -= _value;
    balanceOf[_to] += _value;
    // Transfer events
    emit Transfer(msg.sender, _to, _value);

    return true;
  }

  function approve(address _spender, uint _value) public returns(bool success) {
    // Set Allowance
    allowance[msg.sender][_spender] = _value;
    // Triggers Aprove event
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) public returns(bool success) {
    require(_value <= balanceOf[_from], "Value larger than balance");
    require(_value <= allowance[_from][msg.sender], "Value larger than apporved amount");

    balanceOf[_from] -= _value;
    balanceOf[_to] += _value;

    allowance[_from][msg.sender] -= _value;

    emit Transfer(_from, _to, _value);

    return true;
  }
}