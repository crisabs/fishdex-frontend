import { API_BASE_URL } from "../config";
import { authStore } from "../stores/auth";

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      "The request failed on the server.";

    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return data;
}

async function request(path, { method = "GET", body, auth = false, query } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = {
    Accept: "application/json"
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = authStore.getAccessToken();

    if (!token) {
      throw new Error("No hay access token. Inicia sesion primero.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  return parseResponse(response);
}

export const api = {
  request
};
