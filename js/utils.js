/**
 * ========================================
 * Utils - Hilfsfunktionen
 * ========================================
 * Sammlung von Utility-Funktionen für die gesamte App
 */

/**
 * ========================================
 * ID-Generierung
 * ========================================
 */

/**
 * Generiert eine eindeutige ID
 * @returns {string}
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ========================================
 * Datum & Zeit
 * ========================================
 */

/**
 * Formatiert ein Datum
 * @param {Date|string} date - Datum
 * @param {string} format - Format (YYYY-MM-DD, DD.MM.YYYY, etc.)
 * @returns {string}
 */
export function formatDate(date, format = 'DD.MM.YYYY') {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return 'Ungültiges Datum';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    const formats = {
        'DD.MM.YYYY': `${day}.${month}.${year}`,
        'YYYY-MM-DD': `${year}-${month}-${day}`,
        'DD/MM/YYYY': `${day}/${month}/${year}`,
        'MM/DD/YYYY': `${month}/${day}/${year}`,
        'DD.MM.YYYY HH:mm': `${day}.${month}.${year} ${hours}:${minutes}`,
        'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    };

    return formats[format] || formats['DD.MM.YYYY'];
}

/**
 * Formatiert Zeit in Sekunden zu MM:SS
 * @param {number} seconds - Sekunden
 * @returns {string}
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formatiert Dauer in Sekunden zu lesbarem Format
 * @param {number} seconds - Sekunden
 * @returns {string}
 */
export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Berechnet Differenz zwischen zwei Daten in Tagen
 * @param {Date|string} date1 - Erstes Datum
 * @param {Date|string} date2 - Zweites Datum
 * @returns {number}
 */
export function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Prüft ob Datum heute ist
 * @param {Date|string} date - Datum
 * @returns {boolean}
 */
export function isToday(date) {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
}

/**
 * Gibt relativen Zeitstring zurück (z.B. "vor 2 Tagen")
 * @param {Date|string} date - Datum
 * @returns {string}
 */
export function getRelativeTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
    if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Monaten`;
    return `vor ${Math.floor(diffDays / 365)} Jahren`;
}

/**
 * ========================================
 * Zahlen & Berechnungen
 * ========================================
 */

/**
 * Rundet Zahl auf bestimmte Dezimalstellen
 * @param {number} num - Zahl
 * @param {number} decimals - Anzahl Dezimalstellen
 * @returns {number}
 */
export function round(num, decimals = 2) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Formatiert Zahl mit Tausender-Trennzeichen
 * @param {number} num - Zahl
 * @returns {string}
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Berechnet Prozentsatz
 * @param {number} value - Wert
 * @param {number} total - Gesamtwert
 * @returns {number}
 */
export function percentage(value, total) {
    if (total === 0) return 0;
    return round((value / total) * 100, 1);
}

/**
 * Clamp - Begrenzt Wert zwischen Min und Max
 * @param {number} value - Wert
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * ========================================
 * String-Manipulation
 * ========================================
 */

/**
 * Kapitalisiert ersten Buchstaben
 * @param {string} str - String
 * @returns {string}
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Kürzt String auf bestimmte Länge
 * @param {string} str - String
 * @param {number} maxLength - Maximale Länge
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Entfernt HTML-Tags aus String
 * @param {string} html - HTML-String
 * @returns {string}
 */
export function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Slug erstellen (URL-freundlich)
 * @param {string} str - String
 * @returns {string}
 */
export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * ========================================
 * Array-Helfer
 * ========================================
 */

/**
 * Gruppiert Array nach Eigenschaft
 * @param {Array} array - Array
 * @param {string} key - Eigenschaft
 * @returns {Object}
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

/**
 * Sortiert Array nach Eigenschaft
 * @param {Array} array - Array
 * @param {string} key - Eigenschaft
 * @param {string} order - 'asc' oder 'desc'
 * @returns {Array}
 */
export function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Entfernt Duplikate aus Array
 * @param {Array} array - Array
 * @param {string} key - Eigenschaft (optional)
 * @returns {Array}
 */
export function unique(array, key = null) {
    if (!key) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

/**
 * ========================================
 * Validierung
 * ========================================
 */

/**
 * Prüft ob Wert leer ist
 * @param {*} value - Wert
 * @returns {boolean}
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Prüft ob Wert eine Zahl ist
 * @param {*} value - Wert
 * @returns {boolean}
 */
export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

/**
 * Prüft ob String eine gültige Email ist
 * @param {string} email - Email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * ========================================
 * DOM-Helfer
 * ========================================
 */

/**
 * Erstellt DOM-Element aus HTML-String
 * @param {string} html - HTML-String
 * @returns {Element}
 */
export function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

/**
 * Fügt Event-Listener mit Delegation hinzu
 * @param {Element} parent - Parent-Element
 * @param {string} selector - CSS-Selector
 * @param {string} event - Event-Name
 * @param {Function} handler - Event-Handler
 */
export function delegate(parent, selector, event, handler) {
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target) {
            handler.call(target, e);
        }
    });
}

/**
 * Wartet auf Animation-Ende
 * @param {Element} element - Element
 * @returns {Promise}
 */
export function waitForAnimation(element) {
    return new Promise(resolve => {
        element.addEventListener('animationend', resolve, { once: true });
    });
}

/**
 * Smooth Scroll zu Element
 * @param {Element|string} target - Element oder Selector
 */
export function scrollTo(target) {
    const element = typeof target === 'string'
        ? document.querySelector(target)
        : target;

    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * ========================================
 * LocalStorage-Helfer
 * ========================================
 */

/**
 * Speichert Wert in LocalStorage (mit JSON)
 * @param {string} key - Key
 * @param {*} value - Wert
 */
export function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('LocalStorage Fehler:', e);
    }
}

/**
 * Liest Wert aus LocalStorage (mit JSON)
 * @param {string} key - Key
 * @param {*} defaultValue - Default-Wert
 * @returns {*}
 */
export function getStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('LocalStorage Fehler:', e);
        return defaultValue;
    }
}

/**
 * Entfernt Wert aus LocalStorage
 * @param {string} key - Key
 */
export function removeStorage(key) {
    localStorage.removeItem(key);
}

/**
 * ========================================
 * Debounce & Throttle
 * ========================================
 */

/**
 * Debounce - Verzögert Funktionsaufruf
 * @param {Function} func - Funktion
 * @param {number} wait - Wartezeit in ms
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle - Begrenzt Funktionsaufrufe
 * @param {Function} func - Funktion
 * @param {number} limit - Limit in ms
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * ========================================
 * Sonstiges
 * ========================================
 */

/**
 * Kopiert Text in Zwischenablage
 * @param {string} text - Text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        console.error('Clipboard Fehler:', e);
        return false;
    }
}

/**
 * Wartet für bestimmte Zeit
 * @param {number} ms - Millisekunden
 * @returns {Promise}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generiert Zufallszahl zwischen Min und Max
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Deep Clone eines Objekts
 * @param {Object} obj - Objekt
 * @returns {Object}
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
