const config = {
  apiBaseUrl: process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://ludo-bp9k.onrender.com'  // Replace with your Render backend URL
      : 'http://localhost:5001')
};

export default config;
