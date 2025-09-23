// Queue for storing interceptors
const requestInterceptors = [];
const responseInterceptors = [];
const errorInterceptors = [];

// Function to add request interceptor
export const addRequestInterceptor = (interceptor) => {
  requestInterceptors.push(interceptor);
  return () => {
    const index = requestInterceptors.indexOf(interceptor);
    if (index !== -1) {
      requestInterceptors.splice(index, 1);
    }
  };
};

// Function to add response interceptor
export const addResponseInterceptor = (interceptor) => {
  responseInterceptors.push(interceptor);
  return () => {
    const index = responseInterceptors.indexOf(interceptor);
    if (index !== -1) {
      responseInterceptors.splice(index, 1);
    }
  };
};

// Function to add error interceptor
export const addErrorInterceptor = (interceptor) => {
  errorInterceptors.push(interceptor);
  return () => {
    const index = errorInterceptors.indexOf(interceptor);
    if (index !== -1) {
      errorInterceptors.splice(index, 1);
    }
  };
};

// Function to process request through interceptors
export const processRequest = async (config) => {
  let currentConfig = { ...config };
  
  for (const interceptor of requestInterceptors) {
    currentConfig = await interceptor(currentConfig);
  }
  
  return currentConfig;
};

// Function to process response through interceptors
export const processResponse = async (response) => {
  let currentResponse = response;
  
  for (const interceptor of responseInterceptors) {
    currentResponse = await interceptor(currentResponse);
  }
  
  return currentResponse;
};

// Function to process error through interceptors
export const processError = async (error) => {
  let currentError = error;
  
  for (const interceptor of errorInterceptors) {
    try {
      currentError = await interceptor(currentError);
    } catch (e) {
      console.error('Error in error interceptor:', e);
    }
  }
  
  throw currentError;
};

// Example interceptors
export const setupDefaultInterceptors = () => {
  // Add authentication token to requests
  addRequestInterceptor(async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  });

  // Handle 401 responses
  addResponseInterceptor(async (response) => {
    if (response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return response;
  });

  // Log errors in development
  addErrorInterceptor(async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    throw error;
  });
};