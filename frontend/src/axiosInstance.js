import axios from "axios";

export const apiBaseURL = axios.create({
  baseURL: "https://aura-backend-ebam.onrender.com:8000/api",
  withCredentials: true
});

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};

apiBaseURL.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiBaseURL.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post("https://aura-backend-ebam.onrender.com:8000/api/auth/refresh", {}, { withCredentials: true });
        setAccessToken(res.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return apiBaseURL(originalRequest);
      } catch (err) {
        setAccessToken(null);
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
