import axios from "axios";

const api = axios.create({
  baseURL: "https://api.automateu.space",
  // baseURL: "http://localhost:8000", // your FastAPI backend
  //baseURL: "https://83900ab0ccb8.ngrok-free.app", // your FastAPI backend
  withCredentials: true,            // very important: allows cookies to be sent
  
});

// Request interceptor to add the CSRF token to every request
api.interceptors.request.use(
  (config) => {
    const csrfToken = localStorage.getItem("csrf_token");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// We have removed the problematic response interceptor.
// Error handling will now be done in the React components that make the API calls.

export default api;
