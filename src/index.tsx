/**
 * index.tsx
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */

import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

// Use consistent styling
import './styles/index.css';

// Import root app
import { App } from 'app';

import { HelmetProvider } from 'react-helmet-async';

import { configureAppStore } from 'store/configureStore';

import reportWebVitals from 'reportWebVitals';

import { Web3AuthProvider } from './contexts/SocialLoginContext';
import { SmartAccountProvider } from './contexts/SmartAccountContext';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

// Initialize languages
import './locales/i18n';

const store = configureAppStore();
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/pintoinfant/decentradial-epns-v2',
  cache: new InMemoryCache(),
});

root.render(
  <Web3AuthProvider>
    <SmartAccountProvider>
      <ApolloProvider client={client}>
        <Provider store={store}>
          <HelmetProvider>
            <React.StrictMode>
              <App />
            </React.StrictMode>
          </HelmetProvider>
        </Provider>
        ,{' '}
      </ApolloProvider>
    </SmartAccountProvider>
  </Web3AuthProvider>,
);

// Hot reloadable translation json files
if (module.hot) {
  module.hot.accept(['./locales/i18n'], () => {
    // No need to render the App again because i18next works with the hooks
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
