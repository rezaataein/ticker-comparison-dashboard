/**
 * Yahoo Finance API Data Fetcher
 * Fetches historical OHLCV data for stock tickers
 */

/** The data service could not be reached: proxy down, network error, or rate limit. */
class DataServiceError extends Error {
    constructor(message, attempts) {
        super(message);
        this.name = 'DataServiceError';
        this.attempts = attempts || [];
    }
}

/** Yahoo answered, but it does not know this symbol. The ticker really is wrong. */
class TickerNotFoundError extends Error {
    constructor(ticker, description) {
        super(description || `Unknown symbol: ${ticker}`);
        this.name = 'TickerNotFoundError';
        this.ticker = ticker;
    }
}

class DataFetcher {
    constructor() {
        // Yahoo Finance sends no CORS headers, so the browser cannot call it
        // directly and every request must go through a proxy.
        //
        // Public proxies disappear without warning: corsproxy.io began to
        // require an API key and returned 403 for every request, which stopped
        // the whole dashboard. So do not depend on one proxy. fetchThroughProxies
        // races these with a short stagger and keeps the first good answer.
        //
        // To use your own proxy (most reliable - see README), put it first:
        //   { name: 'my-worker',
        //     url: u => `https://NAME.workers.dev/?url=${encodeURIComponent(u)}`,
        //     unwrap: null }
        // Order matters: fastest first. Measured with bench.mjs, 4 tickers each:
        //   jina            529 ms avg   4/4 ok
        //   allorigins-raw 2622 ms avg   4/4 ok
        //   allorigins-get 3405 ms avg   4/4 ok
        //   codetabs         --          0/4 ok (every call timed out)
        // Re-run `node bench.mjs` and reorder when these numbers drift.
        this.corsProxies = [
            {
                // Returns the body unchanged when asked for text.
                name: 'jina',
                url: u => `https://r.jina.ai/${u}`,
                headers: { 'x-respond-with': 'text' },
                unwrap: null
            },
            {
                name: 'allorigins-raw',
                url: u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
                unwrap: null
            },
            {
                // Puts the body in {"contents": "...", "status": {...}}.
                name: 'allorigins-get',
                url: u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
                unwrap: body => JSON.parse(body).contents
            },
            {
                // Unhealthy at the time of writing. Kept as a last resort: with
                // hedging it costs no time unless every proxy above it fails.
                name: 'codetabs',
                url: u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
                unwrap: null
            }
        ];
        this.baseUrl = 'https://query2.finance.yahoo.com/v8/finance/chart/';

        // Hard deadline for one proxy attempt.
        this.proxyTimeoutMs = 8000;

        // How long to wait for the current proxy before we also start the next
        // one. Requests overlap, so a slow or dead proxy costs this much delay
        // instead of its whole timeout. Keep it above the normal response time
        // of the fastest proxy, or every call needlessly doubles its requests.
        this.hedgeDelayMs = 1200;
    }

    /**
     * Fetch a Yahoo URL through the proxy chain, and take the first good answer.
     *
     * The proxies are hedged, not tried one after another. We start the first
     * proxy, and if it stays quiet for hedgeDelayMs we start the next one as
     * well, and so on. The first usable answer wins and cancels the rest.
     * A strictly sequential chain made every request wait out the proxy in
     * front of it, which made the whole dashboard several times slower.
     *
     * Yahoo reports an unknown symbol in the body (chart.error) together with
     * HTTP 404, so read the body before you judge the status code. If the body
     * is valid Yahoo JSON, trust it and stop the race: a bad ticker must not
     * look like a dead proxy.
     *
     * @param {string} targetUrl - Full Yahoo Finance URL
     * @param {string} ticker - Symbol, for error messages
     * @returns {Promise<Object>} - Parsed Yahoo response
     */
    fetchThroughProxies(targetUrl, ticker) {
        return new Promise((resolve, reject) => {
            const attempts = [];
            const controllers = [];
            let started = 0;
            let ended = 0;
            let done = false;
            let hedgeTimer = null;

            // The first usable answer wins. Cancel every request still open,
            // so a slow proxy never holds the chart back once we have data.
            const settle = (finish, value) => {
                if (done) return;
                done = true;
                clearTimeout(hedgeTimer);
                for (const controller of controllers) {
                    try { controller.abort(); } catch (ignored) { /* already gone */ }
                }
                finish(value);
            };

            const startNext = () => {
                if (done || started >= this.corsProxies.length) return;
                const proxy = this.corsProxies[started++];
                attempt(proxy);

                // Overlap with the next proxy rather than wait out this one.
                if (started < this.corsProxies.length) {
                    clearTimeout(hedgeTimer);
                    hedgeTimer = setTimeout(startNext, this.hedgeDelayMs);
                }
            };

            const attempt = async (proxy) => {
                const abort = new AbortController();
                controllers.push(abort);
                const timer = setTimeout(() => abort.abort(), this.proxyTimeoutMs);

                try {
                    const response = await fetch(proxy.url(targetUrl), {
                        headers: proxy.headers || {},
                        signal: abort.signal
                    });
                    const status = response.status;
                    let body = await response.text();

                    if (proxy.unwrap) {
                        body = proxy.unwrap(body);
                    }
                    if (body == null || body === '') {
                        attempts.push(`${proxy.name}: HTTP ${status}, empty body`);
                    } else {
                        const data = JSON.parse(body);

                        // Yahoo answered in full. Its verdict is final, so stop
                        // the whole race instead of asking the other proxies.
                        if (data && data.chart && data.chart.error) {
                            settle(reject, new TickerNotFoundError(ticker, data.chart.error.description));
                            return;
                        }
                        if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                            settle(resolve, data);
                            return;
                        }
                        attempts.push(`${proxy.name}: HTTP ${status}, unexpected shape`);
                    }
                } catch (error) {
                    // A cancelled request is expected once another proxy wins.
                    if (!done) {
                        attempts.push(`${proxy.name}: ${error.name === 'AbortError'
                            ? `timed out after ${this.proxyTimeoutMs} ms`
                            : error.message}`);
                    }
                } finally {
                    clearTimeout(timer);
                }

                // This proxy failed. Promote the next one now, without waiting
                // out the rest of the hedge delay.
                ended++;
                if (ended === this.corsProxies.length) {
                    settle(reject, new DataServiceError(
                        `Could not reach the price data service. Tried: ${attempts.join('; ')}`,
                        attempts
                    ));
                } else {
                    startNext();
                }
            };

            startNext();
        });
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

            const buildUrl = symbol =>
                `${this.baseUrl}${encodeURIComponent(symbol)}` +
                `?period1=${period1}&period2=${period2}` +
                `&interval=${selectedInterval}${includePrePost}`;

            let data;
            try {
                data = await this.fetchThroughProxies(buildUrl(ticker), ticker);
            } catch (error) {
                // Yahoo writes share classes with a dash (BRK-B), but people type
                // a dot (BRK.B). A dot is also an exchange suffix (TEC.TO), so we
                // cannot tell the two apart up front. Only after Yahoo rejects the
                // symbol do we retry the dash form.
                const dashed = ticker.replace(/\./g, '-');
                if (!(error instanceof TickerNotFoundError) || dashed === ticker) {
                    throw error;
                }
                data = await this.fetchThroughProxies(buildUrl(dashed), ticker);
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
        // `.find` returns undefined (not null) when every value is null, so use loose `== null`.
        const firstClose = close.find(c => c !== null);
        const percentChange = close.map(c => {
            if (c == null || firstClose == null) return null;
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
                        // 'not-found' means the symbol is wrong. 'service' means the
                        // symbol may be good but we could not reach the data.
                        kind: result.reason instanceof TickerNotFoundError
                            ? 'not-found'
                            : 'service',
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
