require('dotenv').load();

const assert = require('assert');
const clone = require('clone');

const binance = require('node-binance-api');
let tradesOpen = {};
let tradeObj = [];
let currentTrades = [];

let devTicker = {};

// DEV
const DEVMODE = false;
// const DEVMODE = true;

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

const binanceWsMap = {
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
  "m": "maker_side",
  "a": "aggregate_trade_id"
};



binance.options({
  APIKEY: process.env.BINANCE_API,
  APISECRET: process.env.BINANCE_SECRET,
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  // test: (process.env.TEST === 'true') // If you want to use sandbox mode where orders are simulated
  // test: !DEVMODE
  test: false
});

// Common utils
function place_limit_orders(tradeSymbol, side, limitData) {
  console.log(`place_limit_orders: ${tradeSymbol} - ${side} - ${JSON.stringify(limitData)}`);
  limitData.forEach(function (obj) {
    place_limit_order(tradeSymbol, side, obj);
  });
}

function add_triggers(symbol, side, newTriggerData) {
  newTriggerData.forEach(function(obj) {
    if (!(symbol in triggerData[side])) {
      triggerData[side][symbol] = [];
    }
    if (!isNaN(parseFloat(obj.qty)) && !isNaN(parseFloat(obj.price))) {
      triggerData[side][symbol].push({
        'qty': obj.qty,
        'price': obj.price
      });
    }
  });
}


// Binance Utils //
function get_base_symbol(tradeSymbol) {
  for (let i=0, len=basePairs.length; i < len; i++) {
    if (tradeSymbol.split(basePairs[i])[1] === '') {
      return basePairs[i];
    }
  }
  return '';
}

function place_limit_order(tradeSymbol, side, obj) {
  if (!obj.qty || !obj.price) {
    console.log(`invalid order placed -- skipping -- ${JSON.stringify(obj)}`);
    return
  }
  if (DEVMODE) {
    console.log(`Would have placed an order for ${tradeSymbol}: ${JSON.stringify(obj)}`);
    return
  }
  console.log(`Preparing to place order ${tradeSymbol} - ${side}: ${JSON.stringify(obj, null, 4)}`);
  // binance[obj.type](tradeSymbol, obj.qty, obj.price, {type: 'LIMIT'}, (error, response) => {
  binance[side](tradeSymbol, obj.qty, obj.price, {type: 'LIMIT'}, (error, response) => {
    console.log(`made binance[${side}] call -- error: ${JSON.stringify(error)} -- response: ${JSON.stringify(response)}`);
    if (error) {
      console.log('Error on order: ', error);
    }

    console.log("Limit ", side, " response", response);
    console.log("order id: " + response.orderId);
  });
}

function map_ws_data(raw_data) {
  let data = {};
  for (let key in binanceWsMap) {
    if (typeof(raw_data[key]) !== "undefined") {
      data[binanceWsMap[key]] = (isNaN(parseFloat(raw_data[key]))) ? raw_data[key] : parseFloat(raw_data[key]);
    }
  }
  return data;
}

function get_all_symbols() {
  let symbolPairs = [];
  binance.bookTickers((error, ticker) => {
    console.log(ticker);

    symbolPairs = Object.keys(ticker);
  });
  return symbolPairs;
}

function get_all_pairs() {
  binance.prices((error, ticker) => {
    devTicker = ticker;
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
      for (let side in triggerData) {
        if (!(s in triggerData)) {
          triggerData[side][s] = [];
        }
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
    if ( available === "0.00000000" ) continue;
    console.log(asset+"\tavailable: "+available+" ("+onOrder+" on order)");
  }
}


function trade_execution_update(raw_data) {
  // console.log('Updated trade status');

  let tradeData = map_ws_data(raw_data);
  tradeData.trigger_qty = tradeData.last_qty;

  let triggerSide = (tradeData.side === 'BUY') ? 'sell' : 'buy';
  console.log('triggerSide: ', triggerSide);

  if ((tradeData.current_type === 'TRADE' || DEVMODE) && tradeData.symbol in triggerData[triggerSide] && triggerData[triggerSide][tradeData.symbol].length) {
    console.log('trade executed with data: ' + JSON.stringify(tradeData));

    if (DEVMODE) {
      console.log('DEVMODE -- modifying trade trigger data');
      tradeData.last_qty += 900;
      tradeData.trigger_qty += 900;
    }

    let priceExtrema, i, curTradeData;
    let n = 0;
    let prices = [];
    let triggerKey = (triggerSide === 'buy') ? 'min' : 'max';
    let data = triggerData[triggerSide][tradeData.symbol];

    data.forEach(function(e) { prices.push(e.price); });

    console.log(tradeData);

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

get_all_pairs();

module.exports = {
  symbolPairs: symbolPairs,
  tradePairs: tradePairs,
  binance: binance,
  basePairs: basePairs,
  get_all_pairs: get_all_pairs,
  get_all_symbols: get_all_symbols,
  get_base_symbol: get_base_symbol,
  map_ws_data: map_ws_data,
  balance_update: balance_update,
  trade_execution_update: trade_execution_update,
  add_triggers: add_triggers,
  triggerData: triggerData,
  place_limit_orders: place_limit_orders
};
