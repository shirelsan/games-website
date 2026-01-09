// --- Configuration ---
const COOKIE_EXPIRY_HOURS = 1; // Default expiration time in hours

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

    try {
        const item = JSON.parse(itemStr);
        const now = new Date();

        // Check if this is a valid cookie (has expiry property)
        if (!item.expiry || typeof item.expiry !== 'number') {
            // Not a valid cookie, remove it
            localStorage.removeItem(key);
            return null;
        }

        // Check if expired
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key); // Delete expired item
            console.log(`Cookie expired: ${key}`);
            
            // If currentUser expired, redirect to login
            if (key === 'currentUser') {
                console.log('Session expired. Redirecting to login...');
                window.location.href = 'login.html';
            }
            
            return null;
        }

        return item.value;
    } catch (e) {
        // Invalid JSON or parsing error, remove the item
        console.error(`Error parsing cookie ${key}:`, e);
        localStorage.removeItem(key);
        return null;
    }
}

/**
 * Deletes a value from localStorage.
 * @param {string} key - The key name.
 */
function deleteCookie(key) {
    localStorage.removeItem(key);
}

/**
 * Checks all stored cookies for expiration and removes expired ones.
 * Specifically ensures currentUser is cleared if expired.
 * This function should be called at the start of every page load.
 * MUST RUN BEFORE any other code accesses getCookie('currentUser')
 */
function validateAllCookies() {
    const now = new Date();
    const keys = Object.keys(localStorage);
    let currentUserExpired = false;

    keys.forEach(key => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return;

        try {
            const item = JSON.parse(itemStr);
            
            // Check if this item has an expiry time (is a cookie, not regular data)
            if (item.expiry && typeof item.expiry === 'number') {
                // If expired, remove it
                if (now.getTime() > item.expiry) {
                    localStorage.removeItem(key);
                    console.log(`Cookie expired and removed: ${key}`);
                    
                    // Mark if currentUser expired
                    if (key === 'currentUser') {
                        currentUserExpired = true;
                    }
                }
            }
        } catch (e) {
            // Not a valid cookie format, skip
            console.error(`Error validating cookie ${key}:`, e);
        }
    });

    // If currentUser expired, redirect to login
    if (currentUserExpired) {
        console.log('Session expired. Redirecting to login...');
        window.location.href = 'login.html';
    }
}

/**
 * Initialize cookie validation on page load IMMEDIATELY
 * This MUST run synchronously before any DOM content loads
 */
(function() {
    // Run validation immediately, before anything else
    validateAllCookies();
})();

// Also run on DOMContentLoaded as a backup
document.addEventListener('DOMContentLoaded', validateAllCookies);
