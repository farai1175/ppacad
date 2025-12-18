// ==========================================
// auth.js - Shared Authentication Module
// must be included on all pages that require auth in the <head><script src="auth.js"></head> section
// PassProof Academy
// ==========================================

const PassProofAuth = (function() {
    // Storage keys
    const STORAGE_KEYS = {
        SESSION_TOKEN: 'passproofSessionToken',
        CURRENT_USER: 'passproofCurrentUser',
        DB_DATA: 'DBppacad_data'
    };

    // Grade mapping
    const GRADE_MAP = {
        1: 8,
        2: 9,
        3: 10,
        4: 11,
        5: 12
    };

    // Role display names
    const ROLE_DISPLAY = {
        'student': 'Student',
        'instructor': 'Instructor',
        'admin': 'Administrator',
        'parent': 'Parent/Guardian'
    };

    // ==========================================
    // CORE AUTHENTICATION FUNCTIONS
    // ==========================================

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    function isAuthenticated() {
        const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
        const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return !!(token && userData);
    }

    /**
     * Get current user data
     * @returns {object|null}
     */
    function getCurrentUser() {
        try {
            const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            if (userData) {
                return JSON.parse(userData);
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
        return null;
    }

    /**
     * Get session token
     * @returns {string|null}
     */
    function getSessionToken() {
        return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    }

    /**
     * Save user session
     * @param {object} user - User data
     * @param {string} token - Session token
     */
    function saveSession(user, token) {
        user.loggedInAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
        console.log('Session saved for:', user.email);
    }

    /**
     * Clear user session (logout)
     */
    function clearSession() {
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        console.log('Session cleared');
    }

    /**
     * Logout user and redirect to login page
     * @param {boolean} confirm - Show confirmation dialog
     */
    function logout(showConfirm = true) {
        if (showConfirm) {
            if (!confirm('Are you sure you want to logout?')) {
                return false;
            }
        }
        clearSession();
        window.location.href = 'login.html';
        return true;
    }

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect to after login
     */
    function requireAuth(redirectUrl = null) {
        if (!isAuthenticated()) {
            if (redirectUrl) {
                sessionStorage.setItem('passproofRedirectAfterLogin', redirectUrl);
            }
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    /**
     * Get redirect URL after login (if set)
     * @returns {string|null}
     */
    function getRedirectUrl() {
        const url = sessionStorage.getItem('passproofRedirectAfterLogin');
        sessionStorage.removeItem('passproofRedirectAfterLogin');
        return url;
    }

    // ==========================================
    // USER INFO HELPERS
    // ==========================================

    /**
     * Get user's full name
     * @param {object} user - User object (optional, uses current user if not provided)
     * @returns {string}
     */
    function getFullName(user = null) {
        const u = user || getCurrentUser();
        if (!u) return 'Guest';
        const firstName = u.first_name || '';
        const lastName = u.last_name || '';
        return `${firstName} ${lastName}`.trim() || u.username || 'User';
    }

    /**
     * Get user's first name
     * @param {object} user - User object (optional)
     * @returns {string}
     */
    function getFirstName(user = null) {
        const u = user || getCurrentUser();
        if (!u) return 'Guest';
        return u.first_name || u.username || 'User';
    }

    /**
     * Get user's initials
     * @param {object} user - User object (optional)
     * @returns {string}
     */
    function getInitials(user = null) {
        const u = user || getCurrentUser();
        if (!u) return '??';
        const first = (u.first_name || '').charAt(0).toUpperCase();
        const last = (u.last_name || '').charAt(0).toUpperCase();
        return (first + last) || (u.username || '??').substring(0, 2).toUpperCase();
    }

    /**
     * Get user's grade level
     * @param {object} user - User object (optional)
     * @returns {number|string}
     */
    function getGradeLevel(user = null) {
        const u = user || getCurrentUser();
        if (!u || !u.idGrade) return null;
        return GRADE_MAP[u.idGrade] || u.idGrade;
    }

    /**
     * Get user's role display name
     * @param {object} user - User object (optional)
     * @returns {string}
     */
    function getRoleDisplay(user = null) {
        const u = user || getCurrentUser();
        if (!u) return 'Guest';
        const role = u.user_role || 'student';
        const roleDisplay = ROLE_DISPLAY[role] || role;
        const grade = getGradeLevel(u);
        if (role === 'student' && grade) {
            return `Grade ${grade} ${roleDisplay}`;
        }
        return roleDisplay;
    }

    // ==========================================
    // UI UPDATE FUNCTIONS
    // ==========================================

    /**
     * Update navigation UI based on auth state
     * This function looks for specific elements and updates them
     */
    function updateNavUI() {
        const user = getCurrentUser();
        const isLoggedIn = isAuthenticated();

        // Find auth-aware elements
        const authButtons = document.querySelectorAll('[data-auth-button]');
        const guestOnly = document.querySelectorAll('[data-guest-only]');
        const authOnly = document.querySelectorAll('[data-auth-only]');
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        const userEmailElements = document.querySelectorAll('[data-user-email]');

        // Handle guest-only elements (hide when logged in)
        guestOnly.forEach(el => {
            el.style.display = isLoggedIn ? 'none' : '';
        });

        // Handle auth-only elements (show only when logged in)
        authOnly.forEach(el => {
            el.style.display = isLoggedIn ? '' : 'none';
        });

        // Handle auth buttons (transform based on state)
        authButtons.forEach(el => {
            if (isLoggedIn) {
                updateAuthButton(el, user);
            }
        });

        // Update user info elements
        if (isLoggedIn && user) {
            userNameElements.forEach(el => {
                el.textContent = getFullName(user);
            });

            userAvatarElements.forEach(el => {
                el.textContent = getInitials(user);
            });

            userRoleElements.forEach(el => {
                el.textContent = getRoleDisplay(user);
            });

            userEmailElements.forEach(el => {
                el.textContent = user.email || '';
            });
        }
    }

    /**
     * Update a single auth button
     * @param {HTMLElement} el - The button element
     * @param {object} user - Current user
     */
    function updateAuthButton(el, user) {
        const buttonType = el.getAttribute('data-auth-button');
        const firstName = getFirstName(user);

        switch (buttonType) {
            case 'cta':
                // Main CTA button - show welcome and dashboard link
                el.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    Welcome, ${firstName}!
                    <a href="dashboard.html" style="margin-left: 10px; color: inherit; text-decoration: underline;">
                        Go to Dashboard <i class="fas fa-arrow-right"></i>
                    </a>
                `;
                el.href = 'dashboard.html';
                break;

            case 'nav':
                // Navigation button - simpler display
                el.innerHTML = `<i class="fas fa-tachometer-alt"></i> Dashboard`;
                el.href = 'dashboard.html';
                break;

            case 'welcome':
                // Welcome text only
                el.innerHTML = `Welcome, ${firstName}! <i class="fas fa-smile"></i>`;
                break;

            default:
                el.innerHTML = `<i class="fas fa-user"></i> ${firstName}`;
        }
    }

    /**
     * Create user menu dropdown (for navigation)
     * @returns {HTMLElement}
     */
    function createUserMenu() {
        const user = getCurrentUser();
        if (!user) return null;

        const menu = document.createElement('div');
        menu.className = 'user-dropdown-menu';
        menu.innerHTML = `
            <div class="user-dropdown-header">
                <div class="user-dropdown-avatar">${getInitials(user)}</div>
                <div class="user-dropdown-info">
                    <span class="user-dropdown-name">${getFullName(user)}</span>
                    <span class="user-dropdown-role">${getRoleDisplay(user)}</span>
                </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <a href="dashboard.html" class="user-dropdown-item">
                <i class="fas fa-tachometer-alt"></i> Dashboard
            </a>
            <a href="dashboard.html#account" class="user-dropdown-item">
                <i class="fas fa-user-cog"></i> My Account
            </a>
            <a href="dashboard.html#settings" class="user-dropdown-item">
                <i class="fas fa-cog"></i> Settings
            </a>
            <div class="user-dropdown-divider"></div>
            <a href="#" class="user-dropdown-item logout-link" onclick="PassProofAuth.logout(); return false;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        `;

        return menu;
    }

    // ==========================================
    // SESSION MONITORING
    // ==========================================

    /**
     * Start session monitoring
     * @param {number} intervalMs - Check interval in milliseconds
     */
    function startSessionMonitor(intervalMs = 60000) {
        setInterval(() => {
            if (!isAuthenticated()) {
                console.log('Session expired or invalidated');
                // Don't redirect if on login page
                if (!window.location.pathname.includes('login.html')) {
                    alert('Your session has expired. Please login again.');
                    window.location.href = 'login.html';
                }
            }
        }, intervalMs);

        // Also check on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !isAuthenticated()) {
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize auth module
     * @param {object} options - Configuration options
     */
    function init(options = {}) {
        const config = {
            updateUI: true,
            monitorSession: false,
            monitorInterval: 60000,
            ...options
        };

        // Update UI if requested
        if (config.updateUI) {
            // Wait for DOM if needed
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', updateNavUI);
            } else {
                updateNavUI();
            }
        }

        // Start session monitoring if requested
        if (config.monitorSession) {
            startSessionMonitor(config.monitorInterval);
        }

        console.log('PassProofAuth initialized. Authenticated:', isAuthenticated());
    }

    // ==========================================
    // PUBLIC API
    // ==========================================
    return {
        // Core functions
        isAuthenticated,
        getCurrentUser,
        getSessionToken,
        saveSession,
        clearSession,
        logout,
        requireAuth,
        getRedirectUrl,

        // User info helpers
        getFullName,
        getFirstName,
        getInitials,
        getGradeLevel,
        getRoleDisplay,

        // UI functions
        updateNavUI,
        createUserMenu,

        // Session monitoring
        startSessionMonitor,

        // Initialization
        init,

        // Constants
        STORAGE_KEYS,
        GRADE_MAP,
        ROLE_DISPLAY
    };
})();

// Auto-initialize when script loads
PassProofAuth.init({ updateUI: true });