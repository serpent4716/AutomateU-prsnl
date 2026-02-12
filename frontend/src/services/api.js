import axios from "axios";

function resolveApiBaseUrl() {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname === "automateu.space" || hostname === "www.automateu.space") {
      return "https://api.automateu.space";
    }
    if (hostname.endsWith(".automateu.space")) {
      return `${protocol}//api.automateu.space`;
    }
  }

  return "http://localhost:8000";
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 60000,
});

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

export default api;
