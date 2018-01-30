// @flow
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// import { Navbar, Jumbotron, Button } from 'react-bootstrap';

import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faMinusCircle } from '@fortawesome/fontawesome-free-solid'
import { faPlusCircle } from '@fortawesome/fontawesome-free-solid'


// const ipcRenderer = require('electron').ipcRenderer;
// const ipcRenderer = window.require('electron').ipcRenderer;
// const { ipcRenderer } = window.require('electron');

// ipcRenderer.send('async', 1);

let labels = {
  'exchange': 'Binance',
  'side': {
    'buy': 'Buy',
    'sell': 'Sell',
  },
  'qty': 'Qty',
  'price': 'Price'
};

// let currentSide = 'buy';
let baserPair = 'BTC';

class TradeConfig extends Component {
  render() {
    return (
      <div className="col-6 trade-setup">
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
}


// class TradeRow extends Component {
//   render() {
//     return (
//       <div className="row">
//         <div className="col">
//           <input type="text" className={`qty qty-${i}`} placeholder={labels.qty} data-order={i} />
//         </div>
//         <div className="col">
//           <input type="text" className={`price price-${i}`} placeholder={labels.price} data-order={i}/>
//         </div>
//       </div>
//     )
//   }
// }

// function AddOrder() {
//   function handleClick(e) {
//     e.preventDefault();
//
//   }
// }


// TODO: bind button to add more order layers

class TradeForm extends Component {
  constructor() {
    super();
    this.state = {
      // TODO: clean up grouped data to belong to nested objs
      // orderBuy: {
      //   orders: [{price: '', qty: ''},{price: '', qty: ''}],
      //   qty: 0,
      //   price: 0
      // },
      ordersBuy: [{price: '', qty: ''},{price: '', qty: ''}],
      orderBuyQty: 0,
      orderBuyPrice: 0,
      ordersSell: [{price: '', qty: ''},{price: '', qty: ''}],
      orderSellPrice: 0,
      tradeSymbol: 'SYMBOL',
      tradeSymbolPrice: 0,
      tradeSymbolQty: 0
    }
  }


  onChange = (e) => {
    this.setState({ tradeSymbol: e.target.value});
  };

  onChangeSymbol = (e) => {
    const state = this.state;
    state.tradeSymbol = e.target.value;
    this.setState(state);

    console.log('changeSymbol: ', state.tradeSymbol);

    // TODO: get data from ipcRenderer
  };

  // TODO: refactor from Buy / Sell functions to single set with side var
  onChangeQtyBuy = (i) => (e) => {
    // TODO: confirm value is an int/float else disallow
    // console.log('orders Qty Buy called');
    let buyQty = parseFloat(e.target.value);
    const newOrdersBuy = this.state.ordersBuy.map((orderBuy, idx) => {
      // console.log('ordersQtyBuy ', idx);
      if (i !== idx) {
        buyQty += orderBuy.qty;
        return orderBuy;
      }
      return { ...orderBuy, qty: parseFloat(e.target.value) };
    });
    this.setState({ordersBuy: newOrdersBuy, orderBuyQty: buyQty });
  };

  onChangePriceBuy = (i) => (e) => {
    // console.log('orders Qty Buy called');
    let buyPrice = parseFloat(e.target.value);
    const newOrdersBuy = this.state.ordersBuy.map((orderBuy, idx) => {
      // TODO: confirm value is an int/float else disallow
      // console.log('ordersPriceBuy ', idx);
      if (i !== idx) {
        buyPrice += orderBuy.price;
        return orderBuy;
      }
      return { ...orderBuy, price: parseFloat(e.target.value) };
    });
    this.setState({ordersBuy: newOrdersBuy, orderBuyPrice: buyPrice});
  };

  addTradeRowBuy = () => {
    this.setState({ ordersBuy: this.state.ordersBuy.concat([{price: '', qty: ''}]) });
  };

  removeTradeRowBuy = (i) => () => {
    console.log('removeTradeRowBuy');
    this.setState({ ordersBuy: this.state.ordersBuy.filter((obj, idx) => i !== idx) });
  };

  onChangeQtySell = (i) => (e) => {
    console.log('orders Qty Sell called');
    const newOrdersSell = this.state.ordersSell.map((orderSell, idx) => {
      console.log('ordersQtySell ', idx);
      if (i !== idx) return orderSell;
      return { ...orderSell, qty: e.target.value };
    });
    this.setState({ordersSell: newOrdersSell});
  };

  onChangePriceSell = (i) => (e) => {
    console.log('orders Qty Sell called');
    const newOrdersSell = this.state.ordersSell.map((orderSell, idx) => {
      console.log('ordersPriceSell ', idx);
      if (i !== idx) return orderSell;
      return { ...orderSell, price: e.target.value };
    });
    this.setState({ordersSell: newOrdersSell});
  };

  addTradeRowSell = () => {
    console.log('addTradeRowSell');
    this.setState({ ordersSell: this.state.ordersSell.concat([{price: '', qty: ''}]) });
  };

  removeTradeRowSell = (i) => () => {
    console.log('removeTradeRowSell');
    this.setState({ ordersSell: this.state.ordersSell.filter((obj, idx) => i !== idx) });
  };

  renderTradeSetup(side) {
    return (
      <div className="col-6 trade-setup">
        <p>Coins in Order: <span className="qty-total">{ this.state.orderBuyQty }</span></p>
        <p><span>{baserPair}</span> (cost): <span className="price-total">{this.state.orderBuyPrice}</span></p>
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

  render() {
    // const { orderBuyPrice, orderSellPrice, tradeSymbol, tradeSymbolPrice } = this.state;
    return (
      <form className="container" onSubmit={this.handleSubmit}>
        <div className="row">
          <h3 className="exchange-title">{labels.exchange}</h3>
        </div>
        <div className="row mb-3">
          <div className="col">
            <label htmlFor="symbol">Trade Pair</label>
            <input
              type="text"
              className="form-control"
              value={this.state.tradeSymbol}
              onChange={this.onChangeSymbol}/>
          </div>
          <div className="col">
            <label htmlFor="symbol-price">Current Price</label>
            <input
              type="text"
              disabled
              value={this.state.tradeSymbolPrice}
            />
          </div>
        </div>
        <div className="form-group mb-2">
          <h1 className="col-6">{labels.side.buy}</h1>
          <div className="row">
            <div className="col-6">
              <div className="row">
                <h3 className="col">{labels.qty}</h3>
                <h3 className="col">{labels.price}</h3>
              </div>
              {this.state.ordersBuy.map((orderBuy, i) => (
                <div className="row mb-3" key={`order-buy-${i}`}>
                  <div className="col-5">
                    <input
                      type="text"
                      className="qty"
                      placeholder={`${labels.qty} #${i+1}`}
                      value={orderBuy.qty}
                      onChange={this.onChangeQtyBuy(i)}
                    />
                  </div>
                  <div className="col-5">
                    <input
                      type="text"
                      placeholder={`${labels.price} #${i+1}`}
                      value={orderBuy.price}
                      onChange={this.onChangePriceBuy(i)} />
                  </div>
                  <div className="col-2">
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={this.removeTradeRowBuy(i)}>
                        <FontAwesomeIcon icon={faMinusCircle}/>
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-6">
                <button type="button" className="btn btn-success" onClick={this.addTradeRowBuy}>
                  <FontAwesomeIcon icon={faPlusCircle} className="fa-lg"/>
                </button>
              </div>
            </div>

            {this.renderTradeSetup('buy')}
          </div>
        </div>
        <hr className="mb-3"/>
        <div className="form-group mb-2">
          <h1 className="col-6">{labels.side.sell}</h1>
          <div className="row">
            <h3 className="col-3">{labels.qty}</h3>
            <h3 className="col-3">{labels.price}</h3>
          </div>
          <div className="row">
            <div className="col-6">
              {this.state.ordersSell.map((orderSell, i) => (
                <div className="row mb-3" key={`order-buy-${i}`}>
                  <div className="col-5">
                    <input
                      type="text"
                      className="qty"
                      placeholder={`${labels.qty} #${i+1}`}
                      value={orderSell.qty}
                      onChange={this.onChangeQtySell(i)}
                    />
                  </div>
                  <div className="col-5">
                    <input
                      type="text"
                      placeholder={`${labels.price} #${i+1}`}
                      value={orderSell.price}
                      onChange={this.onChangePriceSell(i)} />
                  </div>
                  <div className="col-2">
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={this.removeTradeRowSell(i)}>
                        <FontAwesomeIcon icon={faMinusCircle}/>
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-6">
                <button type="button" className="btn btn-success" onClick={this.addTradeRowSell}>
                  <FontAwesomeIcon icon={faPlusCircle} className="fa-lg"/>
                </button>
              </div>
            </div>
            {this.renderTradeSetup('sell')}
          </div>
          <hr className="mb-3"/>
        </div>
        <div className="col-6">
          <button type="submit" className="btn btn-primary">Submit</button>
        </div>
      </form>
    );
  }
}


class App extends Component {
  constructor() {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.stopPropagation();

    console.log(e.target);

    const data = new FormData(e.target);

  //  TODO: send data to node via ipcRenderer
  //  ipcRenderer.send
    console.log(data);
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

        <TradeForm />

      </div>
    );
  }
}

export default App;
