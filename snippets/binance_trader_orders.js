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
        'qty': 800,
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

let binanceWsMap = {
  "e": "event_type",
  "E": "event_time",
  "s": "symbol",
  "c": "client_order_id",
  "S": "side",
  "o": "order_type",
  "f": "time_in_force",
  "q": "order_quantity",
  "p": "order_price",
  "P": "stop_price",
  "F": "iceberg_quantity",
  "C": "original_client_order_id",
  "x": "current_type",
  "X": "order_status",
  "r": "reject_reason",
  "i": "order_id",
  "l": "last_quantity",
  "z": "cumulative_quantity",
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


function mapBinanceWsData(raw_data) {
  let data = {};
  for (let key in binanceWsMap) {
    data[binanceWsMap[key]] = (isNaN(parseFloat(raw_data[key]))) ? raw_data[key] : parseFloat(raw_data[key]);
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

function place_limit_orders(symbol_pair, limitData) {
  limitData.forEach(function (obj) {
    place_limit_order(symbol_pair, obj);
  });
}

// end Header Setup


function balance_update(data) {
  console.log("Balance Updates\n");
  for ( let obj of data.B ) {
    let { a:asset, f:available, l:onOrder } = obj;
    if ( available == "0.00000000" ) continue;
    console.log(asset+"\tavailable: "+available+" ("+onOrder+" on order)");
  }
}


let tradeData = {};
function trade_execution_update(raw_data) {
  console.log('Updated trade status');

  console.log('data:\n', raw_data, '\n\n');

  let { x:executionType, s:symbol, p:price, q:quantity, S:side, o:orderType, i:orderId, X:orderStatus } = raw_data;

  if ( executionType === "NEW" ) {
    if ( orderStatus === "REJECTED" ) {
      console.log("Order Failed! Reason: ", data.r);
      return
    }
    console.log(symbol+" "+side+" "+orderType+" ORDER #"+orderId+" ("+orderStatus+")");
    console.log("..price: "+price+", quantity: "+quantity);
    return;
  }

  //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
  console.log(symbol+"\t"+side+" "+executionType+" "+orderType+" ORDER #"+orderId);


  ///////////
  tradeData = mapBinanceWsData(raw_data);

  let triggerSide = (tradeData.side === 'BUY') ? 'sell' : 'buy';
  // if (tradeData.current_type === 'TRADE' && s in triggerData[triggerSide]) {
  console.log('DEVMODE: ', DEVMODE);
  if (DEVMODE && tradeData.symbol in triggerData[triggerSide] && triggerData[triggerSide][tradeData.symbol].length) {
    // DEV
    console.log('Found triggerData for ', tradeData.symbol);

    player.play(alert_path, function(err){
      if (err) throw err
    });
  // END DEV

    let triggerKey = (triggerSide === 'buy') ? 'min' : 'max';
    let data = triggerData[triggerSide][tradeData.symbol];
    let prices = [];
    data.forEach(function(e) { prices.push(e.price); });

    let n = 0;
    while (n < 1) {
      if (tradeData.last_quantity === 0 || !data.length) {
        n = 1;  // trigger exit of loop
      }

      let priceExtrema = prices.reduce(function(a, b) { return Math[triggerKey](a, b); });
      let i = prices.indexOf(priceExtrema);
      let curTradeData = clone(data[i]);
      assert.equal(curTradeData.price, priceExtrema);
      if (tradeData.last_quantity < curTradeData.qty) {
        curTradeData.qty = tradeData.last_quantity;
      }

      console.log('preparing to palce limit order');
      place_limit_order(data.symbol, curTradeData);

      if (curTradeData.qty >= data[i].qty) {
        data.splice(i, 1);
        tradeData.last_quantity -= curTradeData.qty;
      } else {
        data[i].qty -= curTradeData.qty;
      }

      console.log('Placed order for ', tradeData.symbol, ' for: ', curTradeData);
      // TODO: alert user
    }
  } else {
    console.log('no triggerData for ', triggerSide, ' ', tradeData.symbol);
  }
}

binance.websockets.userData(balance_update, trade_execution_update);


