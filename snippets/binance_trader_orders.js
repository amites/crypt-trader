// Begin Header Setup
require('dotenv').load();

const binance = require('node-binance-api');
let tradesCurrent = [];
let tradesTrigger = {};


// Setup pairs
let basePairs = ['BTC', 'ETH', 'BNB', 'USDT'];
let symbolPairs = [];
let tradePairs = {};
basePairs.forEach(function(e) {
  tradePairs[e] = [];
});

tradesTrigger['BNBUSDT'] = {
  'qty': '0.85',
  'price': '1113.0574',
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
    data[binanceWsMap[key]] = raw_data[key]
  }
  return data;
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


let trade_data = {};
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
  trade_data = mapBinanceWsData(raw_data);

  if (trade_data.current_type === 'TRADE' && s in tradesTrigger) {
    // place trade
      // create loop, trade qty - trigger qty
      // if trigger qty > trade qty update trade qty
    // update tradesTrigger
      // remove entries where qty 0
      // check for empty list
        // alert user
    // log event
    // alert user
  }
}

binance.websockets.userData(balance_update, trade_execution_update);


