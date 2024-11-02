import React from 'react';
import { withRouter } from 'react-router-dom';
import App from './App';

function RoutedApp(props) {
  return <App {...props} />;
}

export default withRouter(RoutedApp);
