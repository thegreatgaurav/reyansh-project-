import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import oauthConfig from './config/oauthConfig';

// Directly load the Google API client and initialize the app after it's loaded
window.onload = () => {
  if (window.gapi) {
    initializeApp();
  } else {
    // If gapi isn't available, load it from script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = initializeApp;
    document.body.appendChild(script);
  }
};

// Initialize the React app
function initializeApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 