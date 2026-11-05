import axios from "axios";
import { TIMEOUT_API_MS } from "@/lib/celi/config";

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://totem-ceunsp-backend.onrender.com/api",
  timeout: TIMEOUT_API_MS,
});
