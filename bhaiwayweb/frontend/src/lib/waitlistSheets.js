const WEBHOOK_URL = (process.env.REACT_APP_GOOGLE_SHEETS_WEBHOOK_URL || "").trim();
const REWARD_LABEL = "50 Bhaiway Coins";

export async function submitWaitlistToGoogleSheet({ name, email, role, city }) {
  if (!WEBHOOK_URL) {
    throw new Error(
      "Waitlist is not configured. Set REACT_APP_GOOGLE_SHEETS_WEBHOOK_URL in your .env file."
    );
  }

  const payload = {
    timestamp: new Date().toISOString(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    city,
    reward: REWARD_LABEL,
  };

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Unexpected response from waitlist service. Please try again.");
  }

  if (!result.ok) {
    throw new Error(result.error || "Something went wrong. Please try again.");
  }

  return result;
}
