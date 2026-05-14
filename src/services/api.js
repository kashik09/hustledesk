const BASE_URL = "http://127.0.0.1:5001/api";

export const api = {
  get: async (url, token) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  post: async (url, body, token) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
};