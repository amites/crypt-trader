// @flow
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Autosuggest from 'react-autosuggest';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'react-bootstrap';

import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faMinusCircle } from '@fortawesome/fontawesome-free-solid'
import { faPlusCircle } from '@fortawesome/fontawesome-free-solid'


// const ipcRenderer = require('electron').ipcRenderer;
// const ipcRenderer = window.require('electron').ipcRenderer;
// const { ipcRenderer } = window.require('electron');
const {ipcRenderer} = window.require('electron');

// console.log(ipcRenderer.send('async', 'ping'))


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
let symbolPairs = [];


ipcRenderer.on('error', function (e, data) {

});

// TODO: lookup how to trigger modal via js
class ModalError extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false
    };

    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  render() {
    return (
      <div>
        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          <ModalHeader toggle={this.toggle}>Modal title</ModalHeader>
          <ModalBody>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggle}>Do Something</Button>{' '}
            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

// Auto Suggest SYMBOL
const getSuggestions = value => {
  const inputValue = value.trim().toUpperCase();
  const inputLength = inputValue.length;

  if (!symbolPairs.length) {
    // console.log('no symbol pairs defined');
    load_trade_symbols();
    return []
  } else {
    // console.log('Got symbol pairs: ', symbolPairs);
    return inputLength === 0 ? [] : symbolPairs.filter(lang =>
      lang.toUpperCase().slice(0, inputLength) === inputValue
    );
  }
};

const getSuggestionValue = suggestion => suggestion;

const renderSuggestion = suggestion => (
  <div>
    {suggestion}
  </div>
);

// Load SYMBOLs from node
ipcRenderer.on('get-trade-symbols-render', function (e, data) {
  console.log('get-trade-symbols: ', data);
  symbolPairs = data;

});

function load_trade_symbols() {
  if (!symbolPairs.length) {
    ipcRenderer.send('get-trade-symbols', []);
  } else {
    return symbolPairs;
  }
}

// class TradeConfig extends Component {
//   render() {
//     return (
//       <div className="col-6 trade-setup">
//         <p>Coins in Order: <span className="qty-total">0</span></p>
//         <p><span id="base-pair">{baserPair}</span> (cost): <span className="price-total">0</span></p>
//         <div className="row">
//           <div className="col">
//             <label htmlFor="percent-step">% Step</label>
//             <input type="text" className="percent-step" default="5"/>
//           </div>
//         </div>
//       </div>
//     );
//   }
// }


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
      orderBuyPrice: 0,
      orderBuyQty: 0,
      ordersSell: [{price: '', qty: ''},{price: '', qty: ''}],
      orderSellPrice: 0,
      orderSellQty: 0,
      tradeSymbol: '',
      tradeSymbolMoveClass: 'secondary',
      tradeSymbolPrice: '-',
      suggestions: []
      // TODO: add 2nd state store for price & qty to hold view value vs code value
      //   - allow . as first char (auto add 0)
      //   - allow . as trailing char & 0, etc...
    };

    load_trade_symbols();

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('symbol-price', function (e, data) {
      // console.log('Got symbol-price: ', data);
      if (data.symbol === this.state.tradeSymbol) {
        let displayClass = '';
        if (this.state.tradeSymbol < data.order_price) {
          displayClass = 'success';
        } else if (this.state.tradeSymbol > data.order_price) {
          displayClass = 'danger';
        } else {
          displayClass = 'secondary';
        }
        this.setState({
          tradeSymbolPrice: data.order_price,
          tradeSymbolMoveClass: displayClass
        });
      }
    }.bind(this));
  };

  onChangeSymbol = (e, {newValue}) => {
    if (typeof(newValue) === 'undefined') {
      return;
    }

    const state = this.state;
    state.tradeSymbol = newValue.toUpperCase();
    this.setState(state);

    // console.log('changeSymbol: ', state.tradeSymbol);
    if (state.tradeSymbol.length >= 5) {
      ipcRenderer.send('change-symbol', state.tradeSymbol);
    }
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: getSuggestions(value)
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  // TODO: refactor from Buy / Sell functions to single set with side var
  // BUY/SELL FUNCTIONS
  onChangeQty(e, i, stateObj) {
    let newQty = parseFloat(e.target.value);
    let totalPrice = 0;
    let totalQty = newQty;
    // TODO: more tweaking to allow . at end of # entry
    if (isNaN(newQty)) {
      totalQty = 'invalid';
      if (!e.target.value.length) {
        newQty = '';
      } else {
        newQty = e.target.value;
      }
    }
    const newOrders = stateObj.map((order, idx) => {
      // console.log('ordersQtyBuy ', idx);
      if (i !== idx) {
        if (totalQty !== 'invalid') {
          totalQty += order.qty;
          if (totalPrice !== 'invalid') {
            totalPrice += order.price * order.qty;
          }
        }
        return order;
      }
      if (totalQty !== 'invalid' && totalPrice !== 'invalid') {
        totalPrice += order.price * newQty;
      }
      return { ...order, qty: newQty };
    });
    return [newOrders, totalQty, totalPrice];
  }

  onChangeQtyBuy = (i) => (e) => {
    let [newOrdersBuy, buyQty, buyPrice] = this.onChangeQty(e, i, this.state.ordersBuy);
    this.setState({ordersBuy: newOrdersBuy, orderBuyQty: buyQty, orderBuyPrice: buyPrice });
  };

  onChangeQtySell = (i) => (e) => {
    let [newOrdersSell, sellQty, sellPrice] = this.onChangeQty(e, i, this.state.ordersSell);
    this.setState({ordersSell: newOrdersSell, orderSellQty: sellQty, orderSellPrice: sellPrice });
  };

  onChangePrice(e, i, stateObj) {
    let newPrice = parseFloat(e.target.value);
    let totalPrice = 0;
    if (isNaN(newPrice)) {
      if (!e.target.value.length) {
        newPrice = '';
      } else {
        newPrice = e.target.value;
      }
      totalPrice = 'invalid';
    }
    const newOrders = stateObj.map((order, idx) => {
      // TODO: confirm value is an int/float else disallow
      // console.log('ordersPriceBuy ', idx);
      if (i !== idx) {
        if (totalPrice !== 'invalid') {
          totalPrice += order.price * order.qty;
        }
        return order;
      }
      if (totalPrice !== 'invalid') {
        totalPrice += newPrice * order.qty;
      }
      return {...order, price: newPrice};
    });
    return [newOrders, totalPrice];
  }

  onChangePriceBuy = (i) => (e) => {
    // console.log('orders Qty Buy called');
    let [newOrdersBuy, buyPrice] = this.onChangePrice(e, i, this.state.ordersBuy);
    this.setState({ordersBuy: newOrdersBuy, orderBuyPrice: buyPrice});
  };

  onChangePriceSell = (i) => (e) => {
    // console.log('orders Qty Sell called');
    let [newOrdersSell, sellPrice] = this.onChangePrice(e, i, this.state.ordersSell);
    this.setState({ordersSell: newOrdersSell, orderSellPrice: sellPrice});
  };


  addTradeRowBuy = () => {
    this.setState({ ordersBuy: this.state.ordersBuy.concat([{price: '', qty: ''}]) });
  };

  removeTradeRowBuy = (i) => () => {
    // console.log('removeTradeRowBuy');
    this.setState({ ordersBuy: this.state.ordersBuy.filter((obj, idx) => i !== idx) });
  };

  renderTradeSetupBuy(side) {
    return (
      <div className="col-6 trade-setup">
        <p>Coins in Order: <span className="qty-total">{ this.state.orderBuyQty }</span></p>
        <p><span>{baserPair}</span> (price): <span className="price-total">{this.state.orderBuyPrice}</span></p>
        {/*<div className="row">*/}
          {/*<div className="col">*/}
            {/*<label htmlFor="percent-step">% Step</label>*/}
            {/*<input type="text" className="percent-step" default="5"/>*/}
          {/*</div>*/}
        {/*</div>*/}
      </div>
    );
  }

  addTradeRowSell = () => {
    // console.log('addTradeRowSell');
    this.setState({ ordersSell: this.state.ordersSell.concat([{price: '', qty: ''}]) });
  };

  removeTradeRowSell = (i) => () => {
    // console.log('removeTradeRowSell');
    this.setState({ ordersSell: this.state.ordersSell.filter((obj, idx) => i !== idx) });
  };

  renderTradeSetupSell(side) {
    return (
      <div className="col-6 trade-setup">
        <p>Coins in Order: <span className="qty-total">{ this.state.orderSellQty }</span></p>
        <p><span>{baserPair}</span> (price): <span className="price-total">{this.state.orderSellPrice}</span></p>
      </div>
    );
  }
  // END BUY/SELL FUNCTIONS

  handleSubmit(e) {
    console.log('pressed button');
    console.log(this.state);

    // TODO: validate data valid
    ipcRenderer.send('submit-order', this.state);

    e.preventDefault();
  }

  render() {
    // const { orderBuyPrice, orderSellPrice, tradeSymbol, tradeSymbolPrice } = this.state;

    const { tradeSymbol, suggestions } = this.state;
    const symbolInputProps = {
      placeholder: 'SYMBOL',
      value: tradeSymbol,
      onChange: this.onChangeSymbol
    };
    return (
      <form className="container mb-3" onSubmit={this.handleSubmit}>
        <div className="row mb-3">
          <div className="col-sm-12 col-md-6 symbol-wrapper">
            <label htmlFor="symbol">Trade Pair</label>
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              getSuggestionValue={getSuggestionValue}
              renderSuggestion={renderSuggestion}
              inputProps={symbolInputProps}
            />
          </div>
          <div className="col-sm-12 col-md-6">
            <h4>Current Price</h4>
            <div
              className={`alert alert-${this.state.tradeSymbolMoveClass} col-md-4 offset-md-4`}>
              {this.state.tradeSymbolPrice}
            </div>
          </div>
        </div>
        <div className="form-group mb-2">
          <h1 className="col-sm-12 col-md-6">{labels.side.buy}</h1>
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
                <button type="button" className="btn btn-outline-success" onClick={this.addTradeRowBuy}>
                  <FontAwesomeIcon icon={faPlusCircle} className="fa-lg"/>
                </button>
              </div>
            </div>

            {this.renderTradeSetupBuy('buy')}
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
            <div className="col-sm-12 col-md-6">
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
                <button type="button" className="btn btn-outline-success" onClick={this.addTradeRowSell}>
                  <FontAwesomeIcon icon={faPlusCircle} className="fa-lg"/>
                </button>
              </div>
            </div>
            {this.renderTradeSetupSell('sell')}
          </div>
          <hr className="mb-3"/>
        </div>
        <div className="col-sm-12 col-md-6 mb-3">
          <button type="submit" className="btn btn-primary">Submit</button>
        </div>
      </form>
    );
  }
}


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>
            <img src={logo} className="App-logo" alt="logo" />
            CryptTrader
          </h1>
        </header>

        <h3 className="text-center">{labels.exchange}</h3>
        <TradeForm />

      </div>
    );
  }
}

export default App;
