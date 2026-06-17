import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, networkErrorMessage } from "@/lib/config";
import type { SignInFormValues } from "@/app/sign-in";
import type { SignUpFormValues } from "@/app/sign-up";

/**
 * Mobile twin of the web app's `actions/auth-action.ts`.
 *
 * The web version runs as Next.js Server Actions so the refresh token can live
 * in an HTTP-only cookie. React Native has neither server actions nor a cookie
 * jar we want to trust, so here we do the equivalent on-device:
 *
 *   • read the `Set-Cookie: refresh_tk=…` header the backend returns,
 *   • persist that refresh token in the OS keystore (expo-secure-store),
 *   • replay it as a `Cookie` header when refreshing the access token.
 *
 * The backend contract is identical — no server changes needed. Every function
 * returns the same discriminated `{ success, data | error }` result the RTK
 * mutations branch on, so the redux layer is a 1:1 copy of the web app.
 */

const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

/** Keystore key under which the long-lived refresh token is stored. */
const REFRESH_TK_KEY = "refresh_tk";

/** A backend error body, e.g. `{ status, message, errors? }`. */
type AuthError = {
  status?: number;
  message?: string;
  errors?: { field: string; message: string }[];
};

/**
 * Pull `refresh_tk` out of a response's `Set-Cookie` header and store it in the
 * keystore. Unlike browsers, React Native exposes `Set-Cookie` to JS, so we can
 * read it directly. The JWT is base64url (no commas), so a single regex is a
 * safe way to extract it even when several cookies are comma-joined.
 */
async function persistRefreshFromResponse(res: Response) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return;

  const match = setCookie.match(/refresh_tk=([^;,\s]+)/);
  if (match?.[1]) {
    await SecureStore.setItemAsync(REFRESH_TK_KEY, match[1]);
  }
}

/** Best-effort parse of an error response body into an {@link AuthError}. */
async function readError(res: Response): Promise<AuthError> {
  try {
    return (await res.json()) as AuthError;
  } catch {
    return { status: res.status, message: "Something went wrong." };
  }
}

/**
 * Registers a new account against `POST /auth/sign-up`.
 *
 * `terms` is a UI-only checkbox — it is stripped so only the backend DTO fields
 * (name, email, phone, password, role) are sent. On success the returned refresh
 * token is persisted to the keystore.
 */
export const signUpAction = async (signUpData: SignUpFormValues) => {
  try {
    const { terms: _terms, ...payload } = signUpData;
    const res = await fetch(`${AUTH_BASE_URL}/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return { success: false as const, error: await readError(res) };

    await persistRefreshFromResponse(res);
    return { success: true as const, data: await res.json() };
  } catch {
    return {
      success: false as const,
      error: { status: 500, message: networkErrorMessage() },
    };
  }
};

/**
 * Authenticates an existing user via `POST /auth/sign-in`. Mirrors
 * {@link signUpAction}: persists the refresh token returned in the cookie.
 */
export const signInAction = async (signInData: SignInFormValues) => {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(signInData),
    });

    if (!res.ok) return { success: false as const, error: await readError(res) };

    await persistRefreshFromResponse(res);
    return { success: true as const, data: await res.json() };
  } catch {
    return {
      success: false as const,
      error: { status: 500, message: networkErrorMessage() },
    };
  }
};

/**
 * Exchanges the stored refresh token for a fresh access token via
 * `GET /auth/access-tk`.
 *
 * Reads `refresh_tk` from the keystore and forwards it manually as a `Cookie`
 * header (the backend reads it from there), since RN fetch does not share a
 * browser-style cookie jar.
 */
export const getAccessTkAction = async () => {
  try {
    const refreshTk = await SecureStore.getItemAsync(REFRESH_TK_KEY);
    if (!refreshTk) {
      return { success: false as const, error: { message: "No refresh token found" } };
    }

    const res = await fetch(`${AUTH_BASE_URL}/access-tk`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `refresh_tk=${refreshTk}`,
      },
    });

    if (!res.ok) return { success: false as const, error: await readError(res) };

    return { success: true as const, data: await res.json() };
  } catch {
    return {
      success: false as const,
      error: { status: 500, message: networkErrorMessage() },
    };
  }
};

/**
 * Removes the refresh token from the keystore.
 *
 * Used by the sign-out flow; because the backend keeps no server-side session,
 * deleting the token is enough to terminate the authenticated state.
 */
export const deleteRefreshToken = async () => {
  await SecureStore.deleteItemAsync(REFRESH_TK_KEY);
};

/**
 * Whether a refresh token exists on the device. Used by the route guards to
 * decide between the auth screens and the protected shell — the mobile
 * equivalent of the web app's `proxy.ts` cookie check.
 */
export const hasRefreshToken = async () => {
  return (await SecureStore.getItemAsync(REFRESH_TK_KEY)) !== null;
};
