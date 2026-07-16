// frontend/js/auth.js

/**
 * Reusable Security Session Guard
 * Automatically ejects unauthenticated users trying to access secure pages.
 * @param {string} requiredRole - The role allowed to view the page ('admin' or 'institute')
 */
function protectPage(requiredRole) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== requiredRole) {
        // Clear out any invalid or corrupted storage items
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Eject the user cleanly back to the login screen
        window.location.href = '../auth/login.html';
    }
}

/**
 * Reusable Secure Sign-Out Pipeline
 * Clears the user session data completely and redirects to login.
 */
function signOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../auth/login.html';
}