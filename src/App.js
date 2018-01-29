// @flow
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// import { Navbar, Jumbotron, Button } from 'react-bootstrap';

let labels = {
  'exchange': 'Binance',
  'side': {
    'buy': 'Buy',
    'sell': 'Sell',
  },
  'qty': 'Qty',
  'price': 'Price'
};

let currentSide = 'buy';
let baserPair = 'BTC';


class App extends Component {
  renderTradeSetup(side) {
    return (
      <div className="col-6 trade-setup" data-key={side}>
        <p>Coins in Order: <span className="qty-total">0</span></p>
        <p><span id="base-pair">{baserPair}</span> (cost): <span className="price-total">0</span></p>
        <div className="row">
          <div className="col">
            <label htmlFor="num-orders"># Orders</label>
            <input type="text" className="num-orders"/>
          </div>
          <div className="col">
            <label htmlFor="percent-step">% Step</label>
            <input type="text" className="percent-step" default="5"/>
          </div>
        </div>
      </div>
    );
  }

  renderTradeRow(side, i) {
    return (
      <div className="row">
        <div className="col">
          <input type="text" className="qty" placeholder={labels.qty} data-order={i} />
        </div>
        <div className="col">
          <input type="text" className="price" placeholder={labels.price} data-order={i}/>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>
            <img src={logo} className="App-logo" alt="logo" />
            CryptTrader
          </h1>
        </header>

        {/*form.container>(div.row>h3)+(div.row.mb-3>(div.col>input#symbol)+(div.col>label+input[disabled]#symbol-price))+(div.form-group.mb-2*2>h1+(div.row>(div.col-6>div.row>div.col*2>input#buy-1)+(div.col-6>(p*2>span)+div.row>div.col*2>label+input))+hr.mb-3*/}
        <form className="container">
          <div className="row">
            <h3 className="exchange-title">{labels.exchange}</h3>
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="symbol">Trade Pair</label>
              <input type="text" id="symbol" className="form-control" placeholder="SYMBOL"/>
            </div>
            <div className="col">
              <label htmlFor="symbol-price">Current Price</label>
              <input type="text" disabled id="symbol-price"/>
            </div>
          </div>
          <div className="form-group mb-2">
            <h1>{labels.side.buy}</h1>
            <div className="row">
              <div className="col-6">
                <div className="row">
                  <h3 className="col">{labels.qty}</h3>
                  <h3 className="col">{labels.price}</h3>
                </div>
                {this.renderTradeRow('buy', 1)}

              </div>

              {this.renderTradeSetup('buy')}
            </div>
            <hr className="mb-3"/>
          </div>
          <div className="form-group mb-2">
            <h1>{labels.side.sell}</h1>
            <div className="row">
              <div className="col-6">
                {this.renderTradeRow('sell', 1)}
              </div>
              <div className="col-6">
                {this.renderTradeSetup('sell')}
              </div>
            </div>
            <hr className="mb-3"/>
          </div>
        </form>
      </div>
    );
  }
}

export default App;
