const API_BASE = "/api";

export async function calculateTrip(input) {
  try {
    const response = await fetch(`${API_BASE}/calculate-trip/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const contentType = response.headers.get("Content-Type") || "";
      let errorMessage = "API request failed";

      if (contentType.includes("application/json")) {
        const error = await response.json();
        errorMessage = error.detail || error.message || JSON.stringify(error);
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err) {
    if (err instanceof SyntaxError || err.message.includes("Unexpected token")) {
      throw new Error("Received invalid JSON from backend. Check that the Django server is running and the proxy is configured correctly.");
    }
    throw err;
  }
}
