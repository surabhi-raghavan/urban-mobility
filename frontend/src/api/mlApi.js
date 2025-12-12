const RAW_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

/**
 * Build a simple URL string by concatenation.
 * No new URL(..) usage => no "string did not match the expected pattern" errors.
 */
function makeUrl(path) {
  const base = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function handleJsonResponse(res) {
  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch (_) {
      // ignore
    }
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// ------------- API FUNCTIONS ------------------

export async function getMlStatus() {
  const res = await fetch(makeUrl("/ml/status"));
  return handleJsonResponse(res);
}

export async function getFeatureImportances() {
  const res = await fetch(makeUrl("/ml/feature-importances"));
  return handleJsonResponse(res);
}

/**
 * city should be a full string like:
 * "Chicago, Illinois, USA"
 */
export async function getCityFeatures(city) {
  const url = makeUrl(`/ml/city-features?city=${encodeURIComponent(city)}`);
  const res = await fetch(url);
  return handleJsonResponse(res);
}

/**
 * body = { city, scenario, severity }
 * severity is a float (e.g. 0.1)
 */
export async function mlPredict(body) {
  const res = await fetch(makeUrl("/ml/predict"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleJsonResponse(res);
}

export async function getCitiesOverview() {
  const res = await fetch(makeUrl("/ml/cities-overview"));
  return handleJsonResponse(res);
}
