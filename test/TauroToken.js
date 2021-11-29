var TauroToken = artifacts.require('TauroToken')

contract('TauroToken', (accounts) => {

  it('initializes contract with the corect values', async  () => {
    const tokenInstance = await TauroToken.deployed()
    const tokenName = await tokenInstance.name()
    assert.equal(tokenName, "TauroToken", "it has the correct name")
    const tokenSymbol = await tokenInstance.symbol()
    assert.equal(tokenSymbol, 'TAU')
  })

  it('allocates the initial supply upon deployment', async () => {
    const tokenInstance = await TauroToken.deployed()
    const totalSupply = await tokenInstance.totalSupply()
    assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1M')
    const adminBalance = await tokenInstance.balanceOf(accounts[0])
    assert.equal(adminBalance.toNumber(), 1000000, 'it alocates the initial supply to the admin account')
  })

  // it('transfer ownership', async () => {
  //   const tokenInstance = await TauroToken.deployed()
  //   try {
  //     await tokenInstance.transfer.call(accounts[1], 99999999999999999999999)
  //   } catch (err) {
  //     assert(err.message.includes('invalid number value'), true, 'invalid number value transferred')
  //   }

  //   const transfer = await tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] })
  //   assert.equal(transfer, true, 'it returns true')

  //   const receipt = await tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] })

  //   assert.equal(receipt.logs.length, 1, 'triggers one event')
  //   assert.equal(receipt.logs[0].event, 'Transfer', 'should be Transfer event')
  //   assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from')
  //   assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to')
  //   assert.equal(receipt.logs[0].args._value, 250000, 'logs the amount transferred')

  //   const balanceReceiver = await tokenInstance.balanceOf(accounts[1])
  //   assert.equal(balanceReceiver.toNumber(), 250000, 'adds the amount to receiving account')
  //   const balanceSender = await tokenInstance.balanceOf(accounts[0])
  //   assert.equal(balanceSender.toNumber(), 750000, 'deducts amount from sending account')
  // })

  it('transfers token ownership', function() {
    return TauroToken.deployed().then(function(instance) {
      tokenInstance = instance;
      // Test `require` statement first by transferring something larger than the sender's balance
      return tokenInstance.transfer.call(accounts[1], 99999999999999999999999);
    }).then(assert.fail)
    .catch(function (error) {
      assert(error.message, "error message must contain revert");
      return tokenInstance.transfer.call(accounts[1], 250000, {
        from: accounts[0],
      });
    }).then(function(success) {
      assert.equal(success, true, 'it returns true');
      return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
      assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
      assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
      return tokenInstance.balanceOf(accounts[1]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 750000, 'deducts the amount from the sending account');
    });
  });

  it('approves tokens for delegated transfer', async () => {
    const tokenInstance = await TauroToken.deployed()
    const success = await tokenInstance.approve.call(accounts[1], 100)
    assert.equal(success, true, 'it returns true')

    const receipt = await tokenInstance.approve(accounts[1], 100, { from: accounts[0] })

    assert.equal(receipt.logs.length, 1, 'triggers one event')
    assert.equal(receipt.logs[0].event, 'Approval', 'should be Approval event')
    assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are transferred from')
    assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are transferred to')
    assert.equal(receipt.logs[0].args._value, 100, 'logs the amount transferred')

    const allowance = await tokenInstance.allowance(accounts[0], accounts[1])
    assert.equal(allowance.toNumber(), 100, 'stores the allowonce for delegated transfer')
  })

  it('handles delegated token transfers', async () => {
    const tokenInstance = await TauroToken.deployed()
    fromAccount = accounts[2]
    toAccount = accounts[3]
    spendingAccount = accounts[4]

    await tokenInstance.transfer(fromAccount, 100, { from: accounts[0] })
    await tokenInstance.approve(spendingAccount, 10, { from: fromAccount })
    try {
      // Try transfering something larger than the sender's balance
      await tokenInstance.transferFrom(fromAccount, toAccount, 950, { from: spendingAccount })
    } catch(err) {
      assert(err.message.includes('Value larger than balance'), true, 'cannot transfer value larger than balance')
    }
    // Try transfering something large than the apporved amount
    try {
      await tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount })
    } catch(err) {
      assert(err.message.includes('Value larger than apporved amount'), true, 'cannot transfer value larger than apporved amount')
    }
    const success = await tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount })
    assert.equal(success, true)
    
    const receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount })

    assert.equal(receipt.logs.length, 1, 'triggers one event')
    assert.equal(receipt.logs[0].event, 'Transfer', 'should be Transfer event')
    assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from')
    assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to')
    assert.equal(receipt.logs[0].args._value, 10, 'logs the amount transferred')

    const balanceFromAccount = await tokenInstance.balanceOf(fromAccount)
    assert.equal(balanceFromAccount.toNumber(), 90, 'deducts the amount from the sending account')
    const balanceToAccount = await tokenInstance.balanceOf(toAccount)
    assert.equal(balanceToAccount.toNumber(), 10, 'adds the amount to the receiving account')
    const allowance = await tokenInstance.allowance(fromAccount, spendingAccount)
    assert.equal(allowance.toNumber(), 0, 'it deducts the amount from the allowance')
  })
})