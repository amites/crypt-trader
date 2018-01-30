require('dotenv').load();

const assert = require('assert');
const clone = require('clone');

const binance = require('node-binance-api');
let tradesOpen = {};
let tradeObj = [];
let currentTrades = [];

let devTicker = {};


// Setup pairs
let basePairs = ['BTC', 'ETH', 'BNB', 'USDT'];
let symbolPairs = [];
let tradePairs = {};
// map to basePairs
basePairs.forEach(function(e) {
  tradePairs[e] = [];
});

let triggerData = {
  'buy': {},
  'sell': {}
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
  // test: (process.env.TEST === 'true') // If you want to use sandbox mode where orders are simulated
  test: true
});

// Common utils
function place_limit_orders(tradeSymbol, side, limitData) {
  limitData.forEach(function (obj) {
    place_limit_order(tradeSymbol, obj);
  });
}

function add_triggers(newTriggerData) {
  newTriggerData.forEach(function(e) {
    triggerData[e.symbol].push({
      'qty': e.qty,
      'price': e.price
    });
  });
}


// Binance Utils //
function place_limit_order(tradeSymbol, obj) {
  binance[obj.type](tradeSymbol, obj.qty, obj.price, {type: 'LIMIT'}, (error, response) => {
    console.log('Error on order: ', error);

    console.log("Limit Buy response", response);
    console.log("order id: " + response.orderId);
  });
}

function map_binance_ws_data(raw_data) {
  let data = {};
  for (let key in binanceWsMap) {
    data[binanceWsMap[key]] = raw_data[key]
  }
  return data;
}

function get_binance_pairs() {
  binance.bookTickers((error, ticker) => {
    devTicker = ticker;
    symbolPairs = Object.keys(ticker);
    Object.keys(ticker).forEach(function(s) {
      // setup tradePairs
      basePairs.forEach(function(p) {
        // TODO: sloppy logic to split pairs
        if (s.split(p)[1] === '') {
          let symbol = s.replace(p, '');
          if (tradePairs[p].indexOf(symbol) <= -1) {
            tradePairs[p].push(symbol);
          }
        }
      });

      // setup triggerData
      if (!(s in triggerData)) {
        triggerData[s] = [];
      }
    });
  });

  return tradePairs;
}

// End Binance Utils //


// API Docs for websocket value names
// https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md


// ws triggered functions
// Trade

// Demo data for place_limit_orders
// let newlimitData = {
//   'IOSTBTC': [
//     {
//       'qty': 400,
//       'price': 0.00003238,
//       'type': 'buy'
//     },
//     {
//       'qty': 600,
//       'price': 0.00003228,
//       'type': 'buy'
//     },
//     {
//       'qty': 800,
//       'price': 0.00003218,
//       'type': 'buy'
//     }
//   ]
// };
//


// let triggerData = {
//   'buy': {
//     'IOSTBTC': [
//       {
//         'qty': 400,
//         'price': 0.00003238
//       },
//       {
//         'qty': 600,
//         'price': 0.00003228
//       },
//       {
//         'qty': 800,
//         'price': 0.00003218
//       }
//     ]
//   },
//   'sell': {
//     'IOSTBTC': [
//       {
//         'qty': 400,
//         'price': 0.00003249
//       },
//       {
//         'qty': 600,
//         'price': 0.00003239
//       },
//       {
//         'qty': 800,
//         'price': 0.00003229
//       }
//     ]
//   }
// };
function balance_update(data) {
  console.log("Balance Updates\n");
  for ( let obj of data.B ) {
    let { a:asset, f:available, l:onOrder } = obj;
    if ( available == "0.00000000" ) continue;
    console.log(asset+"\tavailable: "+available+" ("+onOrder+" on order)");
  }
}


function trade_execution_update(raw_data) {
  // console.log('Updated trade status');

  let tradeData = map_binance_ws_data(raw_data);
  tradeData.trigger_qty = tradeData.last_qty;

  let triggerSide = (tradeData.side === 'BUY') ? 'sell' : 'buy';
  console.log('triggerSide: ', triggerSide);

  if (tradeData.current_type === 'TRADE' && tradeData.symbol in triggerData[triggerSide] && triggerData[triggerSide][tradeData.symbol].length) {
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

      console.log('Placed order for ', tradeData.symbol, ' pending: ', tradeData.trigger_qty, ' for: ', curTradeData, '\n');
      // TODO: alert user

      if (tradeData.trigger_qty === 0 || !data.length) {
        n = 1;  // trigger exit of loop
      } else {
        console.log('End of loop -- ', tradeData.symbol, ' -- trigger_qty: ', tradeData.trigger_qty);
      }
    }
  } else {
    console.log('no triggers for ', triggerSide, ' ', tradeData.symbol);
  }
}


// setUp
function setUp() {
  binance.websockets.userData(balance_update, trade_execution_update);
}

