import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

function RouterWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default RouterWrapper;
