const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

const binance = require('./api/binance');
let binanceSymbols = [];

const ipcMain = require('electron').ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = false;

// Change symbol

// TODO: refactor to remove direct calls to binance API and migrate into binance.js
function change_symbol_callback(e, tradeSymbol) {
  if (binanceSymbols.indexOf(tradeSymbol) >= 0) {
    binance.binance.websockets.trades(tradeSymbol, (trades) => {
      let data = binance.map_ws_data(trades);

      // console.log(`${tradeSymbol} current data ${data}`)
      e.sender.send('symbol-price', data)
    });
  } else {
    console.log('trade symbol not found: ', tradeSymbol);
    e.sender.send('symbol-price', 'INVALID');
  }
}

function set_binance_symbols_callback(e, tradeSymbol, ticker) {
  binanceSymbols = Object.keys(ticker);
  change_symbol_callback(e, tradeSymbol)
}

ipcMain.on('change-symbol', function(e, tradeSymbol) {
  // TODO: manage disconnecting old sockets on change
  if (binanceSymbols.length) {
    change_symbol_callback(e, tradeSymbol)
  } else {
    binance.binance.prices((error, ticker) => {
      set_binance_symbols_callback(e, tradeSymbol, ticker)
    });
  }
});

ipcMain.on('submit-order', function (e, data) {
  console.log('called submit-order');

  // console.log(data)
  if (binance.symbolPairs && binance.symbolPairs.indexOf(data.tradeSymbol) === -1) {
    console.log('Invalid symbol -- skipping');
    e.sender.send('error', {msg: 'Invalid symbol -- Order not placed'});
  }
  // TODO: add sanity checking against order -- could be inside API?

  // TODO: loop through buy orders -- place orders
  binance.place_limit_orders(data.tradeSymbol, 'buy', data.ordersBuy);

  // TODO: loop through sell orders -- update tradeData
  binance.add_triggers(data.tradeSymbol, 'sell', data.ordersSell);

  // binance.add_triggers(data.tradeSymbol, 'buy', data.ordersBuy);

  // console.log('triggerData: ', binance.triggerData );
  console.log(`added triggerData: buy: ${JSON.stringify(data.ordersBuy)} - sell: ${JSON.stringify(data.ordersSell)}`);
});

function get_trade_symbols_callback(e, data) {
  console.log(`called get-symbols-callback: ${JSON.stringify(data)}`);
  e.sender.send('node-call', data);
}

ipcMain.on('call-node', function (e, data) {
  console.log('called get-symbols');
  console.log(JSON.stringify(data));

  if (data.cmd === 'get-symbols') {
    let apiData = {
        cmd: 'symbols-render',
        base: binance.basePairs
    };
    if (binance.symbolPairs.length) {
      apiData.trade = binance.symbolPairs;
      return get_trade_symbols_callback(e, apiData);
    } else {
      binance.binance.bookTickers((error, ticker) => {
        console.log('got tickers: ', JSON.stringify(Object.keys(ticker)));
        for (let i=0, len=ticker.length; i<len; i++) {
          binance.symbolPairs.push(ticker[i]['symbol']);
        }
        apiData.trade = binance.symbolPairs;
        get_trade_symbols_callback(e, apiData);
      });
    }
  }
  else if (data.cmd === 'get-account-balance') {
    binance.binance.balance((error, balances) => {
      console.log('got balance updates: ', JSON.stringify(balances));
      sendBalanceUpdate(balances);
    });
  }
});

// Setup Binance
function balanceUpdateCallback(data) {
  console.log("Balance Updates\n");
  let userData = {};
  for (let obj of data.B ) {
    userData[obj.a] = obj.f;
  }
  sendBalanceUpdate(userData);
}

function sendBalanceUpdate(data) {
  if (mainWindow) {
    console.log('sending balance data to mainWindow');
    let apiData = {};

    mainWindow.webContents.send('node-call', {
      cmd: 'update-account',
      data: data
    });
  } else {
    console.log('mainWindow not available to set balance');
  }
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'public/icons/png/64x64.png')
  });

  // and load the index.html of the app.
  // mainWindow.loadURL('http://localhost:3000');
  const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '/../build/index.html'),
      protocol: 'file:',
      slashes: true
  });
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  // setup server environment
  binance.binance.websockets.userData(balanceUpdateCallback, binance.trade_execution_update);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});
