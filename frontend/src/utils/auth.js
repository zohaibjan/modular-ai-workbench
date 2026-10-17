/**
 * Auth helpers for the Hub platform.
 *
 * The JWT lives in an HttpOnly cookie managed by the server — the frontend
 * can never read it directly. Auth state is determined by calling /api/auth/verify.
 *
 * On any 401 response from the API, dispatch 'auth:logout' so App.jsx can
 * drop back to the login screen without a full page reload.
 */

/**
 * Verify session with the server.
 * Returns the user object {username, role, allowed_apps} if authenticated, or null.
 */
export async function checkAuth() {
  try {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return { username: data.username, role: data.role, allowed_apps: data.allowed_apps };
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // best-effort
  }
  window.dispatchEvent(new CustomEvent('auth:logout'));
}

/**
 * Attach this as an axios response interceptor on any axiosInstance.
 * Fires 'auth:logout' on 401 so App.jsx can show the login screen.
 */
export function attachAuthInterceptor(axiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      return Promise.reject(error);
    },
  );
}
