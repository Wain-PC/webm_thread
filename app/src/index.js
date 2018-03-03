/* Required polyfills */
import 'es6-map/implement'; // window.Map
import values from 'object.values'; // Object.values
/* Actual application dependencies */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

if (!Object.values) {
  values.shim();
}

ReactDOM.render(<App/>, document.getElementById('root'));
