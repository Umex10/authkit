"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/config";
import { SignInFormValues } from "@/app/sign-in/page";
import { SignUpFormValues } from "@/app/sign-up/page";

/**
 * Pre-configured axios instance for the backend auth API.
 *
 * The base URL is the Spring API root plus the `/auth` prefix, so every call
 * hits `/api/v1/auth/*`.
 */
const authFetch = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    Accept: "application/json",
  },
});

/**
 * Server action that registers a new account against the backend.
 *
 * Forwards the form payload to `POST /auth/sign-up`, persists the returned
 * refresh-token cookie via Next.js' cookie store (so it stays HTTP-only and is
 * never exposed to client JS), and returns a discriminated result the RTK
 * mutation can branch on.
 *
 * @returns `{ success: true, data }` on success, otherwise `{ success: false, error }`.
 */
export const signUpAction = async (signUpData: SignUpFormValues) => {
  try {
    // `terms` is a UI-only checkbox — strip it so only the backend DTO fields
    // (name, email, phone, password, role) are sent.
    const { terms: _terms, ...payload } = signUpData;
    const res = await authFetch.post("sign-up", payload);

    const setCookieHeader = res.headers["set-cookie"];
    if (setCookieHeader) {
      await setRefreshCookie(setCookieHeader);
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, error: error.response.data };
    }
    return {
      success: false,
      error: { status: 500, message: "Internal Server error" },
    };
  }
};

/**
 * Server action that authenticates an existing user.
 *
 * Mirrors {@link signUpAction} but targets `POST /auth/sign-in`. The
 * refresh-token cookie returned by the backend is rewritten into the Next.js
 * cookie store so subsequent server requests can read it from `cookies()`.
 *
 * @returns `{ success: true, data }` on success, otherwise `{ success: false, error }`.
 */
export const signInAction = async (signInData: SignInFormValues) => {
  try {
    const res = await authFetch.post("sign-in", signInData);

    const setCookieHeader = res.headers["set-cookie"];
    if (setCookieHeader) {
      await setRefreshCookie(setCookieHeader);
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, error: error.response.data };
    }
    return {
      success: false,
      error: { status: 500, message: "Internal Server error" },
    };
  }
};

/**
 * Server action that exchanges the refresh-token cookie for a fresh access
 * token.
 *
 * Reads the HTTP-only `refresh_tk` cookie from the Next.js cookie store and
 * forwards it manually as a `Cookie` header, because server-action axios calls
 * do not share the browser's cookie jar. The endpoint hit is
 * `GET /auth/access-tk`.
 *
 * @returns `{ success: true, data }` carrying the new AuthResponseDto, or
 *          `{ success: false, error }` when the cookie is missing or rejected.
 */
export const getAccessTkAction = async () => {
  try {
    const cookieStore = await cookies();
    const refreshTk = cookieStore.get("refresh_tk");

    if (!refreshTk) {
      return { success: false, error: "No refresh token found" };
    }

    const res = await authFetch.get("access-tk", {
      headers: {
        Cookie: `refresh_tk=${refreshTk.value}`,
      },
      withCredentials: true,
    });

    return { success: true, data: res.data };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, error: error.response.data };
    }
    return {
      success: false,
      error: { status: 500, message: "Internal Server error" },
    };
  }
};

/**
 * Parses the backend's `Set-Cookie` header and re-emits the `refresh_tk`
 * cookie through the Next.js cookie store with explicit security attributes.
 *
 * Doing the re-emit ourselves guarantees the cookie ends up HTTP-only, scoped
 * to `/`, and with the 30-day lifetime that matches the JWT expiry, independent
 * of what proxies in front of Next.js might strip.
 *
 * NOTE: `secure` is `false` so it works over plain HTTP in local dev. Set it to
 * `true` once you serve the app over HTTPS in production.
 */
async function setRefreshCookie(setCookieHeader: string[]) {
  const cookieStore = await cookies();

  // Find: Set-Cookie: refresh_tk=abc123...; HttpOnly; Path=/
  const refreshTokenCookie = Array.isArray(setCookieHeader)
    ? setCookieHeader.find((c) => c.startsWith("refresh_tk="))
    : setCookieHeader;

  if (refreshTokenCookie) {
    const [nameValue] = refreshTokenCookie.split(";");
    const [, value] = nameValue.split("=");

    cookieStore.set({
      name: "refresh_tk",
      value,
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }
}

/**
 * Removes the refresh-token cookie from the browser.
 *
 * Used by the sign-out flow; because the backend keeps no server-side session,
 * deleting the cookie is sufficient to terminate the user's authenticated
 * state.
 */
export const deleteRefreshCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("refresh_tk");
};
