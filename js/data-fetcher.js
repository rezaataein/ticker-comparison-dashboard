/**
 * Yahoo Finance API Data Fetcher
 * Fetches historical OHLCV data for stock tickers
 */

class DataFetcher {
    constructor() {
        // Using CORS proxy to avoid browser restrictions
        this.corsProxy = 'https://corsproxy.io/?';
        this.baseUrl = 'https://query2.finance.yahoo.com/v8/finance/chart/';
    }

    /**
     * Get Yahoo Finance interval limits
     * @returns {Object} - Interval limits in days
     */
    getIntervalLimits() {
        return {
            '1m': 7,      // 1-minute: max 7 days
            '5m': 60,     // 5-minute: max 60 days
            '15m': 60,    // 15-minute: max 60 days
            '30m': 60,    // 30-minute: max 60 days
            '60m': 730,   // 1-hour: max 730 days
            '1d': Infinity // Daily: unlimited
        };
    }

    /**
     * Validate if interval is compatible with date range
     * @param {string} interval
     * @param {Date} startDate
     * @param {Date} endDate
     * @returns {boolean}
     */
    isIntervalValid(interval, startDate, endDate) {
        const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
        const limits = this.getIntervalLimits();
        return days <= limits[interval];
    }

    /**
     * Get max valid interval for date range
     * @param {Date} startDate
     * @param {Date} endDate
     * @returns {string}
     */
    getMaxValidInterval(startDate, endDate) {
        const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
        const limits = this.getIntervalLimits();

        // Find the finest interval that supports this range
        const intervals = ['1m', '5m', '15m', '30m', '60m', '1d'];

        for (const interval of intervals) {
            if (days <= limits[interval]) {
                return interval;
            }
        }

        return '1d'; // Fallback
    }

    /**
     * Determine optimal interval based on date range
     * @param {Date} startDate
     * @param {Date} endDate
     * @returns {string} - Yahoo Finance interval (1m, 5m, 15m, 30m, 60m, 1d)
     */
    getOptimalInterval(startDate, endDate) {
        const days = (endDate - startDate) / (1000 * 60 * 60 * 24);

        if (days <= 1) return '1m';      // Every minute for single day
        if (days <= 7) return '5m';      // Every 5 minutes for week
        if (days <= 14) return '15m';    // Every 15 minutes for 2 weeks
        if (days <= 30) return '30m';    // Every 30 minutes for month
        if (days <= 60) return '60m';    // Hourly for 2 months max
        return '1d';                     // Daily for longer periods
    }

    /**
     * Get human-readable interval description
     */
    getIntervalDescription(interval) {
        const descriptions = {
            '1m': '1-minute',
            '5m': '5-minute',
            '15m': '15-minute',
            '30m': '30-minute',
            '60m': '1-hour',
            '1d': 'Daily'
        };
        return descriptions[interval] || interval;
    }

    /**
     * Fetch historical data for a ticker
     * @param {string} ticker - Stock symbol (e.g., 'AAPL')
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} interval - Override interval (optional)
     * @returns {Promise<Object>} - OHLCV data
     */
    async fetchTickerData(ticker, startDate, endDate, interval = null) {
        try {
            const period1 = Math.floor(startDate.getTime() / 1000);
            const period2 = Math.floor(endDate.getTime() / 1000);

            // Use provided interval or auto-detect
            let selectedInterval = interval || this.getOptimalInterval(startDate, endDate);

            // Validate interval against date range
            if (!this.isIntervalValid(selectedInterval, startDate, endDate)) {
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                const limits = this.getIntervalLimits();
                throw new Error(`${selectedInterval} interval supports max ${limits[selectedInterval]} days, but range is ${days} days`);
            }

            // Include pre-market and after-hours for intraday intervals
            const isIntraday = ['1m', '5m', '15m', '30m', '60m'].includes(selectedInterval);
            const includePrePost = isIntraday ? '&includePrePost=true' : '';

            const yahooUrl = `${this.baseUrl}${ticker}?period1=${period1}&period2=${period2}&interval=${selectedInterval}${includePrePost}`;
            const url = `${this.corsProxy}${encodeURIComponent(yahooUrl)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error(`No data returned`);
            }

            const parsedData = this.parseYahooData(ticker, data.chart.result[0]);
            parsedData.interval = selectedInterval;

            return parsedData;

        } catch (error) {
            console.error(`Error fetching ${ticker}:`, error);
            throw error;
        }
    }

    /**
     * Parse Yahoo Finance response into usable format
     */
    parseYahooData(ticker, result) {
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        const dates = timestamps.map(ts => new Date(ts * 1000));
        const close = quote.close;
        const volume = quote.volume;
        const open = quote.open;
        const high = quote.high;
        const low = quote.low;

        // Calculate percentage change from first close
        const firstClose = close.find(c => c !== null);
        const percentChange = close.map(c => {
            if (c === null || firstClose === null) return null;
            return ((c - firstClose) / firstClose) * 100;
        });

        return {
            ticker,
            dates,
            open,
            high,
            low,
            close,
            volume,
            percentChange,
            metadata: {
                currency: result.meta.currency,
                symbol: result.meta.symbol,
                exchangeName: result.meta.exchangeName
            }
        };
    }

    /**
     * Fetch data for multiple tickers
     * @param {Array<string>} tickers - Array of ticker symbols
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {string} interval - Override interval (optional)
     * @returns {Promise<Object>} - { successful, failures, interval }
     */
    async fetchMultipleTickers(tickers, startDate, endDate, interval = null) {
        const selectedInterval = interval || this.getOptimalInterval(startDate, endDate);

        const promises = tickers.map(ticker =>
            this.fetchTickerData(ticker, startDate, endDate, selectedInterval)
        );

        try {
            const results = await Promise.allSettled(promises);

            const successfulResults = [];
            const failures = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulResults.push(result.value);
                } else {
                    failures.push({
                        ticker: tickers[index],
                        error: result.reason.message
                    });
                }
            });

            return {
                successful: successfulResults,
                failures: failures,
                interval: selectedInterval
            };

        } catch (error) {
            console.error('Error fetching multiple tickers:', error);
            throw error;
        }
    }

}
