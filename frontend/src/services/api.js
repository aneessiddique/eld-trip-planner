const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "http://localhost:8000/api";

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
    console.log(
      "Response headers:",
      response.headers.get("Access-Control-Allow-Origin")
    );

    if (response.status === 405) {
      throw new Error(
        "405: Method Not Allowed - Django view is not accepting POST. " +
        "Check views.py has @csrf_exempt and handles OPTIONS method."
      );
    }

    if (response.status === 500) {
      const text = await response.text();
      throw new Error(`500 Server Error: ${text}`);
    }

    if (!response.ok) {
      const contentType = response.headers.get("Content-Type") || "";
      let errorMessage = `API request failed with status ${response.status}`;

      if (contentType.includes("application/json")) {
        const error = await response.json();
        errorMessage =
          error.detail ||
          error.message ||
          error.error ||
          JSON.stringify(error);
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("API response received successfully");
    return data;

  } catch (err) {
    console.error("calculateTrip error:", err.message);

    if (err.message.includes("Failed to fetch")) {
      throw new Error(
        "Cannot connect to the backend server. " +
        "This is likely a CORS error. " +
        "Check that vercel.json has CORS headers configured."
      );
    }

    if (
      err instanceof SyntaxError ||
      err.message.includes("Unexpected token")
    ) {
      throw new Error(
        "Received invalid JSON from backend. " +
        "Check Django server is running and returning valid JSON."
      );
    }

    throw err;
  }
}
