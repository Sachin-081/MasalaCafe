
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function formatApiError(data, status, responseBody) {
  const detail = data?.detail;
  if (typeof detail === "string" && detail) return detail;

  if (Array.isArray(detail)) {
    return detail.map((issue) => {
      const field = Array.isArray(issue.loc) ? issue.loc.slice(1).join(".") : "";
      return field ? `${field}: ${issue.msg}` : issue.msg;
    }).join("; ");
  }

  if (responseBody?.trim()) return responseBody.trim().slice(0, 1000);
  return `Request failed (${status})`;
}

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const body = await response.text();
    let data = null;
    if (body) {
      try {
        data = JSON.parse(body);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      throw new Error(formatApiError(data, response.status, body));
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  },
};

export default api;
