import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Index from './test/index.test'

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