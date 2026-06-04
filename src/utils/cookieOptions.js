import { env } from "../config/env.js";

export const cookieOptions = {
  httpOnly: true, // Prevents client-side JS from accessing the cookie
  secure: env.NODE_ENV === "production", // True in prod (requires HTTPS), false in dev
  sameSite: "strict", // Protects against Cross-Site Request Forgery (CSRF)
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};
