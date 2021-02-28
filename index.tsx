import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Index from './components/index'

class App extends Component {
  render() {
    return (
      <>
        <Index />
      </>
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#root'));