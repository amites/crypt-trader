binance.openOrders(false, (error, openOrders) => {
  console.log("openOrders()", openOrders);
  for (var i=0, l=openOrders.length; i<l; i++) {
    trades_open[openOrders[i]['orderId']] = openOrders[i]['symbol'];
    current_trades.push(openOrders[i]);
  }
});

// place limit order
var quantity = 5, price = 0.00402030;
binance.buy("BNBETH", quantity, price, {type:'LIMIT'}, (error, response) => {
	console.log("Limit Buy response", response);
	console.log("order id: " + response.orderId);
});


// stream all trades as they happen
binance.websockets.trades(['IOSTBTC'], (trades) => {
	let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
	console.log(symbol+" trade update. price: "+price+", quantity: "+quantity+", maker: "+maker);
});



// tradeSymbols[1]str.split(basePairs[0])
// tradeSymbols[1]str.split(basePairs[0])
//                ^^^
//
// SyntaxError: Unexpected identifier
//
// > tradeSymbols[1].split(basePairs[0])
// [ 'ETH', '' ]
// > tradeSymbols[1].split(basePairs[0])[1] == ''


// V1.2 -- get current balances before placing orders
binance.balance((error, balances) => {
	console.log("balances()", balances);
	console.log("ETH balance: ", balances.ETH.available);
});

let cur_orders = [];
binance.allOrders("VIBEBTC", (error, orders, symbol) => {
	// console.log(symbol+" orders:", orders);
  console.log(typeof(orders));

	cur_orders = orders;
	for (var i=0; i < cur_orders.length; i++) {
    console.log(cur_orders[i].status);
  };
});



