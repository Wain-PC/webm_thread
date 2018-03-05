import React from 'react';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';
import { ConnectedRouter, routerMiddleware, routerReducer as routing } from 'react-router-redux';
import thunk from 'redux-thunk';
import registerServiceWorker from './registerServiceWorker';
/* Reducers */
import sources from './ducks/sources';
import threads from './ducks/threads';
import thread from './ducks/thread';
/* Additional providers and CSS */
// eslint-disable-next-line
import './semantic-ui/dist/semantic.min.css';
/* Views used in routing */
import DefaultView from './views/DefaultView';
import NotFound from './views/NotFound';
import ThreadsView from "./views/ThreadsView";
import ThreadView from "./views/ThreadView";

const reducer = combineReducers({routing, sources, threads, thread});
const history = createHistory();
const middlewares = [thunk, routerMiddleware(history)];
const store = createStore(reducer, undefined, compose(
  applyMiddleware(...middlewares),
  window.devToolsExtension ? window.devToolsExtension() : f => f,
));
registerServiceWorker(store.dispatch);

const App = () => (
  <Provider store={store}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/" exact component={DefaultView}/>
          <Route path="/:sourceId" exact component={ThreadsView}/>
          <Route path="/:sourceId/:threadId" component={ThreadView}/>
          <Route component={NotFound}/>
        </Switch>
      </ConnectedRouter>
  </Provider>
);

export default App;
