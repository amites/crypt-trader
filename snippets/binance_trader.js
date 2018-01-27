require('dotenv').load();

const binance = require('node-binance-api');
let tradeTrigger = {};



let buy_data = [
  {
    'symbol': 'IOSTBTC',
    'qty': 400,
    'price': 0.00003238
  },
  {
    'symbol': 'IOSTBTC',
    'qty': 600,
    'price': 0.00003228
  },
  {
    'symbol': 'IOSTBTC',
    'qty': 800,
    'price': 0.00003218
  },
];

let sell_data = [
  {
    'symbol': 'IOSTBTC',
    'qty': 400,
    'price': 0.00003238
  },
  {
    'symbol': 'IOSTBTC',
    'qty': 600,
    'price': 0.00003228
  },
  {
    'symbol': 'IOSTBTC',
    'qty': 800,
    'price': 0.00003218
  },
];



function place_limit_orders(limitData, triggerData) {
  limitData.forEach(function(obj) {
    binance.buy(obj.symbol, obj.qty, obj.price, {type:'LIMIT'}, (error, response) => {
      console.log('Error on order: ', error);

      console.log("Limit Buy response", response);
      console.log("order id: " + response.orderId);
    });
  });

  triggerData.forEach(function(e) {
    tradeTrigger[e.symbol].push({
      'qty': e.qty,
      'price': e.price
    });
  });
}


