const TauroTokenSale = artifacts.require('TauroTokenSale')
const TauroToken = artifacts.require('TauroToken')

contract('TauroTokenSale', (accounts) => {
  const tokenPrice = 1000000000000000 // in wei
  const buyer = accounts[1]
  let numberOfTokens
  const admin = accounts[0]
  const tokensAvailable = 750000

  it('initializes contract with the corect values', async  () => {
    const tokenSaleInstance = await TauroTokenSale.deployed()
    const address = await tokenSaleInstance.address
    assert.notEqual(address, 0x0, 'has contract address')

    const addressTokenContract = await tokenSaleInstance.tokenContract()
    assert.notEqual(addressTokenContract, 0x0, 'it has a token contract address')

    const price = await tokenSaleInstance.tokenPrice()
    assert.equal(price, tokenPrice, 'token price is correct')
  })

  it('facilitates token buying', async () => {
    const tokenSaleInstance = await TauroTokenSale.deployed()
    const tokenInstance = await TauroToken.deployed()

    // Provision 75% of all tokens to the token sale
    tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin })

    numberOfTokens = 10

    const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice})
    assert.equal(receipt.logs.length, 1, 'triggers one event')
    assert.equal(receipt.logs[0].event, 'Sell', 'should be Sell event')
    assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens')
    assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased')

    const amount = await tokenSaleInstance.tokensSold()
    assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold')

    const balanceContract = await tokenInstance.balanceOf(tokenSaleInstance.address)
    assert.equal(balanceContract.toNumber(), tokensAvailable - numberOfTokens)

    const balanceBuyer = await tokenInstance.balanceOf(buyer)
    assert.equal(balanceBuyer.toNumber(), numberOfTokens)

    try {
      await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1})
    } catch(err) {
      assert(err.message.includes('revert'), true, 'msg.value must equal number fo tokens in wei')
    }
    // Buy more tokens than available in the contract sale
    try {
      await tokenSaleInstance.buyTokens(800000, { from: buyer, value: 1})
    } catch(err) {
      assert(err.message.includes('revert'), true, 'cannot purchase more tokens than availble in contract sale')
    }
  })

  it('ends token sale', async () => {
    const tokenSaleInstance = await TauroTokenSale.deployed()
    const tokenInstance = await TauroToken.deployed()

    try {
      await tokenSaleInstance.endSale({ from: buyer })
    } catch(err) {
      assert(err.message.includes('revert'), true, 'just admin can end the token sale')
    }

    const result = await tokenSaleInstance.endSale({ from: admin })
    assert.equal(result.receipt.status, true)

    const balance = await tokenInstance.balanceOf(admin)
    assert.equal(balance.toNumber(), 999990, 'returns all unsold token to admin')

    // Check token price was reset when selfdestructed
    const balanceContract = await tokenInstance.balanceOf(tokenSaleInstance.address)
    assert.equal(balanceContract.toNumber(), 0, 'token sale balance was set to zero')
  })
})