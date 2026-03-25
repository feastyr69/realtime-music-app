import axios from "axios";

export const apiBaseURL = axios.create({
  baseURL: "http://localhost:8000/api",
});
