import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://totem-ceunsp-backend.onrender.com/api",
});