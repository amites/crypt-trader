// @flow
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { Navbar, Jumbotron, Button } from 'react-bootstrap';


class App extends Component {
  render() {

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>

        <h1>{process.env.BINANCE_API}</h1>

        <p className="App-intro">

        </p>
      </div>
    );
  }
}

export default App;
