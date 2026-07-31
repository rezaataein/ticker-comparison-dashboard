/**
 * Smart time formatting for chart axes and tooltips
 * Automatically adapts based on data range
 */

/**
 * Format a price with the correct currency symbol for the ticker's exchange.
 * USD -> "$123.45", CAD -> "CA$123.45", EUR -> "€123.45", etc.
 * Falls back to a plain number + code for unrecognized currencies.
 * @param {number} value - Price value
 * @param {string} currency - ISO currency code from Yahoo metadata (e.g. 'USD', 'CAD')
 * @returns {string}
 */
function formatPrice(value, currency) {
    if (value == null || isNaN(value)) return '';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch (e) {
        // Unknown/invalid currency code -> plain number with the code appended
        return `${value.toFixed(2)}${currency ? ' ' + currency : ''}`;
    }
}

/**
 * Create smart formatter that adapts based on data span
 * @param {Array} timestamps - Array of Unix timestamps (seconds)
 * @returns {Function} Formatter function
 */
function createSmartTimeFormatter(timestamps) {
    if (!timestamps || timestamps.length === 0) {
        return (time) => new Date(time * 1000).toLocaleString();
    }

    // Calculate time span
    const firstTime = timestamps[0];
    const lastTime = timestamps[timestamps.length - 1];
    const spanSeconds = lastTime - firstTime;
    const spanDays = spanSeconds / 86400;

    // Intraday (< 2 days): show time only
    if (spanDays < 2) {
        return (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };
    }

    // Multi-day with intraday intervals (2-60 days): show date + time
    if (spanDays < 60) {
        return (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };
    }

    // Long-term daily data (60+ days): show date only
    return (time) => {
        const date = new Date(time * 1000);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: spanDays > 365 ? 'numeric' : undefined
        });
    };
}

/**
 * Create tick mark formatter (for x-axis labels - more concise)
 * @param {Array} timestamps - Array of Unix timestamps (seconds)
 * @returns {Function} Formatter function
 */
function createSmartTickFormatter(timestamps) {
    if (!timestamps || timestamps.length === 0) {
        return (time) => new Date(time * 1000).toLocaleDateString();
    }

    const firstTime = timestamps[0];
    const lastTime = timestamps[timestamps.length - 1];
    const spanSeconds = lastTime - firstTime;
    const spanDays = spanSeconds / 86400;

    // Intraday: time only
    if (spanDays < 2) {
        return (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };
    }

    // Multi-day intraday: compact date + time
    if (spanDays < 60) {
        return (time) => {
            const date = new Date(time * 1000);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();
            const hour = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: true
            });
            return `${month} ${day}, ${hour}`;
        };
    }

    // Long-term: date only
    return (time) => {
        const date = new Date(time * 1000);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: spanDays > 365 ? 'numeric' : undefined
        });
    };
}
