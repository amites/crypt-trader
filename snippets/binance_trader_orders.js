// Begin Header Setup
require('dotenv').load();

// DEV
const player = require('play-sound')(opts = {})
const DEVMODE = true;
let alert_path = '/home/alvin/workspace/cryptocurrency/code/cryptfinder/static/mp3/computer-error.mp3';

// END DEV

const assert = require('assert');
const clone = require('clone');

const binance = require('node-binance-api');
let tradesCurrent = [];
let triggerData = {};


// Setup pairs
let basePairs = ['BTC', 'ETH', 'BNB', 'USDT'];
let symbolPairs = [];
let tradePairs = {};
basePairs.forEach(function(e) {
  tradePairs[e] = [];
});

let binanceWsMap = {
  "e": "event_type",
  "E": "event_time",
  "s": "symbol",
  "c": "client_order_id",
  "S": "side",
  "o": "order_type",
  "f": "time_in_force",
  "q": "order_qty",
  "p": "order_price",
  "P": "stop_price",
  "F": "iceberg_qty",
  "C": "original_client_order_id",
  "x": "current_type",
  "X": "order_status",
  "r": "reject_reason",
  "i": "order_id",
  "l": "last_qty",
  "z": "cumulative_qty",
  "L": "last_price",
  "n": "commission_amount",
  "N": "commission_asset",
  "T": "transaction_time",
  "t": "trade_id",
  "w": "is_working",
  "m": "maker_side"
};

binance.options({
  APIKEY: process.env.BINANCE_API,
  APISECRET: process.env.BINANCE_SECRET,
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  test: true // If you want to use sandbox mode where orders are simulated
});

function map_binance_ws_data(raw_data) {
  let data = {};
  for (let key in binanceWsMap) {
    data[binanceWsMap[key]] = (isNaN(parseFloat(raw_data[key]))) ? raw_data[key] : parseFloat(raw_data[key]);
  }
  return data;
}


// DEVMODE
if (DEVMODE) {
  triggerData = {
    'buy': {
      'BNBUSDT': [
        {
          'qty': 400,
          'price': 0.00003238
        },
        {
          'qty': 600,
          'price': 0.00003228
        },
        {
          'qty': 400,
          'price': 0.00003218
        }
      ]
    },
    'sell': {
      'BNBUSDT': [
        {
          'qty': 400,
          'price': 0.00003249
        },
        {
          'qty': 600,
          'price': 0.00003239
        },
        {
          'qty': 800,
          'price': 0.00003229
        }
      ]
    }
  };
}

function unmap_binance_ws_data(tradeData) {
  let data = {};
  for (let key in binanceWsMap) {
    data[key] = tradeData[binanceWsMap[key]];
  }
  return data;
}

function place_limit_order(symbol_pair, obj) {
  // binance[obj.type](symbol_pair, obj.qty, obj.price, {type: 'LIMIT'}, (error, response) => {
  //   console.log('Error on order: ', error);
  //
  //   console.log("Limit Buy response", response);
  //   console.log("order id: " + response.orderId);
  // });

  console.log('I Would have placed a trade for ', symbol_pair, ' for: ', obj);
}

// END DEVMODE

function place_limit_orders(symbol_pair, limitData) {
  limitData.forEach(function (obj) {
    place_limit_order(symbol_pair, obj);
  });
}

// end Header Setup


function balance_update(data) {
  console.log("Balance Updates\n");
  // for ( let obj of data.B ) {
  //   let { a:asset, f:available, l:onOrder } = obj;
  //   if ( available == "0.00000000" ) continue;
  //   console.log(asset+"\tavailable: "+available+" ("+onOrder+" on order)");
  // }
}


// DEVMODE global var
let lastTradeData = {};

function trade_execution_update(raw_data) {
  // console.log('Updated trade status');

  let tradeData = map_binance_ws_data(raw_data);
  tradeData.trigger_qty = tradeData.last_qty;
  // DEVMODE
  lastTradeData = tradeData;

  let triggerSide = (tradeData.side === 'BUY') ? 'sell' : 'buy';
  console.log('triggerSide: ', triggerSide);

  // if (tradeData.current_type === 'TRADE' && s in triggerData[triggerSide] && triggerData[triggerSide][tradeData.symbol].length) {
  // console.log('DEVMODE: ', DEVMODE);
  if (DEVMODE && tradeData.symbol in triggerData[triggerSide] && triggerData[triggerSide][tradeData.symbol].length) {
    if (DEVMODE) {
      // DEV
      // console.log('Found triggerData for ', tradeData.symbol);

      player.play(alert_path, function (err) {
        if (err) throw err
      });

      tradeData.last_qty += 900;
      tradeData.trigger_qty += 900;
      // END DEV
    }

    let priceExtrema, i, curTradeData;
    let n = 0;
    let prices = [];
    let triggerKey = (triggerSide === 'buy') ? 'min' : 'max';
    let data = triggerData[triggerSide][tradeData.symbol];

    data.forEach(function(e) { prices.push(e.price); });

    while (n < 1) {
      console.log('running loop -- trade_qty: ', tradeData.last_qty, ' trigger_qty: ', tradeData.trigger_qty, ' -- num triggers: ', data.length);

      priceExtrema = prices.reduce(function(a, b) { return Math[triggerKey](a, b); });
      i = prices.indexOf(priceExtrema);
      curTradeData = clone(data[i]);

      // let DEVDATA = clone(data[i]);
      assert.equal(curTradeData.price, priceExtrema);
      if (curTradeData.qty > tradeData.trigger_qty) {
        curTradeData.qty = tradeData.trigger_qty;
      }

      console.log('preparing to place limit order');
      place_limit_order(tradeData.symbol, curTradeData);

      data[i].qty -= curTradeData.qty;
      tradeData.trigger_qty -= curTradeData.qty;
      if (data[i].qty === 0) {
        prices.splice(prices.indexOf(curTradeData.price), 1);
        data.splice(i, 1);
      }

      console.log('Placed order for ', tradeData.symbol, ' pending: ', tradeData.trigger_qty, ' for: ', curTradeData);
      // console.log('Original trigger data: ', DEVDATA);
      // console.log(' current trigger data: ', data[i]);
      console.log('\n');
      // TODO: alert user

      if (tradeData.trigger_qty === 0 || !data.length) {
        n = 1;  // trigger exit of loop
      }
      console.log('End of loop -- ', tradeData.symbol, ' -- trigger_qty: ', tradeData.trigger_qty);
    }
  } else {
    console.log('no triggerData for ', triggerSide, ' ', tradeData.symbol);
  }
}

binance.websockets.userData(balance_update, trade_execution_update);


// Highly verbose demo function
// function trade_execution_update(data) {
//   let { x:executionType, s:symbol, p:price, q:quantity, S:side, o:orderType, i:orderId, X:orderStatus } = data;
//   console.log('Updated trade status');
//   if ( executionType == "NEW" ) {
//     if ( orderStatus == "REJECTED" ) {
//       console.log("Order Failed! Reason: "+data.r);
//     }
//     console.log(symbol+" "+side+" "+orderType+" ORDER #"+orderId+" ("+orderStatus+")");
//     console.log("..price: "+price+", quantity: "+quantity);
//     return;
//   }
//   //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
//   console.log(symbol+"\t"+side+" "+executionType+" "+orderType+" ORDER #"+orderId);
// }
//
//
