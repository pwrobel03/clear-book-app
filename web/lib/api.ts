import axios from "axios";

/**
 * Axios client for Next.js API routes (which proxy to the Spring backend).
 * Credentials (httpOnly cookies) are sent automatically with every request.
 */
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
