// Reusable API request helper for the Analytics Dashboard.
//
// Every analytics card, chart and table pulls its numbers through this one
// helper so no page ever hard-codes a figure. Filters that are empty are
// dropped, credentials ride the session cookie, and a non-OK response throws
// with the status so the caller can render a proper error state.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

export async function fetchAnalytics(endpoint, filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  const response = await fetch(`${API_BASE}${endpoint}${query ? `?${query}` : ""}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Analytics request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload && payload.success === false) {
    throw new Error(payload.message || `Analytics request failed: ${response.status}`);
  }

  return payload;
}
