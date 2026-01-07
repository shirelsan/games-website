// --- Configuration ---
const COOKIE_EXPIRY_HOURS = 24; // Default expiration time in hours

/**
 * Sets a value in localStorage with a configurable expiration time.
 * Uses the global COOKIE_EXPIRY_HOURS constant.
 * @param {string} key - The key name.
 * @param {any} value - The value to store (object or string).
 */
function setCookie(key, value) {
    const now = new Date();
    const item = {
        value: value,
        // Calculate expiry: current time + hours * 60 minutes * 60 seconds * 1000 milliseconds
        expiry: now.getTime() + (COOKIE_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Gets a value from localStorage, checking for expiration.
 * @param {string} key - The key name.
 * @returns {any|null} - The stored value, or null if expired/missing.
 */
function getCookie(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    // Check if expired
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key); // Delete expired item
        return null;
    }

    return item.value;
}

/**
 * Deletes a value from localStorage.
 * @param {string} key - The key name.
 */
function deleteCookie(key) {
    localStorage.removeItem(key);
}

// Example usage integration for your auth.js logic:
// Instead of: localStorage.setItem('currentUser', JSON.stringify(user));
// Use: setCookie('currentUser', user); // Uses the configured hour limit

// Instead of: const user = JSON.parse(localStorage.getItem('currentUser'));
// Use: const user = getCookie('currentUser');