/**
 * Smart time formatting for chart axes and tooltips
 * Automatically adapts based on data range
 */

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
