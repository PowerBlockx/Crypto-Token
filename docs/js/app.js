
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 100000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialized...")
    return App.initEther();
  },

  initEther: function() {
      // Specify default instance provided
      
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        App.web3Provider = window.ethereum;
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(App.web3Provider);
      }else{
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');
        App.web3Provider = provider;
      }  
    return App.initContracts(App.web3Provider);
  },

  initContracts:async function(prov) {
    console.log("working");
    
    $.getJSON("TauroTokenSale.json", function(tauroTokenSale) {
      console.log("working");
      App.contracts.TauroTokenSale = TruffleContract(tauroTokenSale);
      console.log("working 1");
      App.contracts.TauroTokenSale.setProvider(prov);
      App.contracts.TauroTokenSale.deployed().then(function(tauroTokenSale) {
        console.log("Token Sale Address:", tauroTokenSale.address);
      });
    }).done(function() {
      $.getJSON("TauroToken.json", function(tauroToken) {
        App.contracts.TauroToken = TruffleContract(tauroToken);
        App.contracts.TauroToken.setProvider(prov);
        App.contracts.TauroToken.deployed().then(function(tauroToken) {
          console.log("Token Address:", tauroToken.address);
        });
        App.listenForEvents();
        return App.render();
      });
    })    
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.TauroTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    if(window.ethereum){
      ethereum.request({ method: 'eth_requestAccounts' }).then(function(acc){
          App.account = acc[0];
          console.log(App.account);
          $("#accountAddress").html("Your Account: " + App.account);
      });
    }

    // Load token sale contract
    App.contracts.TauroTokenSale.deployed().then(function(instance) {
      tauroTokenSaleInstance = instance;
      return tauroTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(ethers.utils.formatEther(String(App.tokenPrice)));
      return tauroTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.TauroToken.deployed().then(function(instance) {
        tauroTokenInstance = instance;
        return tauroTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.TauroTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }

}

$(function() {
  $(window).load(function() {
    App.init();
  })
});