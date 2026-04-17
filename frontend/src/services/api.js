const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://your-django-backend.herokuapp.com/api' : '/api');

export async function calculateTrip(input) {
  try {
    const url = `${API_BASE.replace(/\/$/, "")}/calculate-trip/`;
    console.log("Calling API:", url);
    console.log("Payload:", JSON.stringify(input));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(input),
    });

    console.log("Response status:", response.status);

    if (response.status === 405) {
      throw new Error(
        "405: Method Not Allowed - The Django backend is not accepting POST requests. Check your Django urls.py and views.py"
      );
    }

    if (!response.ok) {
      const contentType = response.headers.get("Content-Type") || "";
      let errorMessage = `API request failed with status ${response.status}`;
      if (contentType.includes("application/json")) {
        const error = await response.json();
        errorMessage = error.detail || error.message || JSON.stringify(error);
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("API response:", data);
    return data;
  } catch (err) {
    console.error("calculateTrip error:", err.message);
    if (err instanceof SyntaxError || err.message.includes("Unexpected token")) {
      throw new Error(
        "Received invalid JSON from backend. Check Django server is running on port 8000."
      );
    }
    throw err;
  }
}
