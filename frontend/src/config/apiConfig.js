const isBrowser = typeof window !== "undefined";

// Local backend, used when VITE_API_URL is not set in frontend/.env.
const DEFAULT_BASE_URL = "http://localhost:5000";
const DEFAULT_API_URL = `${DEFAULT_BASE_URL}/api`;

const isChoreoUrl = (url) =>
  url.includes("choreoapis.dev") ||
  url.includes("choreoapps.dev") ||
  url.includes("choreo.dev");

let baseUrl;
let apiUrl;
if (isBrowser && window?.configs?.apiUrl) {
  // Read from window.configs if it exists (Choreo deployment).
  baseUrl = window.configs.apiUrl;
  if (isChoreoUrl(baseUrl)) {
    // Choreo API URL - use the full path as configured (already includes /api).
    apiUrl = baseUrl;
    console.log("[apiConfig] Using Choreo API URL:", apiUrl);
  } else {
    apiUrl = `${baseUrl}/api`;
    console.log("[apiConfig] Using window.configs API URL:", apiUrl);
  }
} else {
  // Otherwise, use VITE_API_URL from frontend/.env (full URL including /api).
  apiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
  baseUrl = apiUrl.replace(/\/api$/, ""); // local backend without /api prefix
  console.log("[apiConfig] Using Local API URL:", apiUrl);
}

// Debug logging for API URL configuration.
console.log("[apiConfig] API Configuration Debug:");
console.log("  - Base URL:", baseUrl);
console.log("  - Final API URL:", apiUrl);
console.log("  - Is Choreo:", isChoreoUrl(baseUrl));

// Function to test API connectivity and return true when reachable.
export const testApiConnectivity = async (testUrl) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${testUrl}/health`, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 404; // 404 may still indicate a reachable server.
  } catch (error) {
    console.log(`[apiConfig] API test failed for ${testUrl}:`, error);
    return false;
  }
};

// Function to get working API URL with fallbacks.
export const getWorkingApiUrl = async () => {
  const possibleUrls = [
    apiUrl,
    `${baseUrl}/api`,
    baseUrl,
    DEFAULT_API_URL,
    DEFAULT_BASE_URL,
  ];

  console.log("[apiConfig] Testing possible API URLs:", possibleUrls);

  for (const url of possibleUrls) {
    if (await testApiConnectivity(url)) {
      console.log(`[apiConfig] Working API URL found: ${url}`);
      return url;
    }
  }

  console.log("[apiConfig] No working API URL found, using default:", apiUrl);
  return apiUrl;
};

export { baseUrl, apiUrl };
export default apiUrl;
