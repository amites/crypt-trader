require('dotenv').load();

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

let tradeTriggers = {};
// tradeTriggers['BNBUSDT'] = {
//   'qty': '0.85',
//   'price': '1113.0574',
// };

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

// Binance Utils //

function mapBinanceWsData(raw_data) {
  let data = {};
  for (let key in binanceWsMap) {
    data[binanceWsMap[key]] = raw_data[key]
  }
  return data;
}

function getBinancePairs() {
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

      // setup tradeTriggers
      if (!(s in tradeTriggers)) {
        tradeTriggers[s] = [];
      }
    });
  });
}

// End Binance Utils //


// API Docs for websocket value names
// https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md


// Get Data Functions
function balance_update(data) {
  console.log("Balance Updates\n");
  for ( let obj of data.B ) {
    let { a:asset, f:available, l:onOrder } = obj;
    if ( available == "0.00000000" ) continue;
    console.log(asset+"\tavailable: "+available+" ("+onOrder+" on order)");
  }
}


function trade_execution_update(data) {
  let { x:executionType, s:symbol, p:price, q:quantity, S:side, o:orderType, i:orderId, X:orderStatus } = data;
  console.log('Updated trade status');
  if ( executionType == "NEW" ) {
    if ( orderStatus == "REJECTED" ) {
      console.log("Order Failed! Reason: "+data.r);
    }
    console.log(symbol+" "+side+" "+orderType+" ORDER #"+orderId+" ("+orderStatus+")");
    console.log("..price: "+price+", quantity: "+quantity);
    return;
  }
  //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
  console.log(symbol+"\t"+side+" "+executionType+" "+orderType+" ORDER #"+orderId);
}




// Trade

// Demo data for place_limit_orders
// let limitData = [
//   {
//     'symbol': 'IOSTBTC',
//     'qty': 400,
//     'price': 0.00003238,
//     'type': 'buy'
//   },
//   {
//     'symbol': 'IOSTBTC',
//     'qty': 600,
//     'price': 0.00003228,
//     'type': 'buy'
//   },
//   {
//     'symbol': 'IOSTBTC',
//     'qty': 800,
//     'price': 0.00003218,
//     'type': 'buy'
//   }
// ];
//
// let triggerData = [
//   {
//     'symbol': 'IOSTBTC',
//     'qty': 400,
//     'price': 0.00003238,
//     'type': 'sell'
//   },
//   {
//     'symbol': 'IOSTBTC',
//     'qty': 600,
//     'price': 0.00003228,
//     'type': 'sell'
//   },
//   {
//     'symbol': 'IOSTBTC',
//     'qty': 800,
//     'price': 0.00003218,
//     'type': 'sell'
//   }
// ];

function place_limit_orders(limitData, triggerData) {
  limitData.forEach(function(obj) {
    binance[obj.type](obj.symbol, obj.qty, obj.price, {type:'LIMIT'}, (error, response) => {
      console.log('Error on order: ', error);

      console.log("Limit Buy response", response);
      console.log("order id: " + response.orderId);
    });
  });

  triggerData.forEach(function(e) {
    tradeTriggers[e.symbol].push({
      'qty': e.qty,
      'price': e.price
    });
  });
}



// setUp
function setUp() {
  binance.websockets.userData(balance_update, trade_execution_update);
}

