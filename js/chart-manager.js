/**
 * Chart Manager - TradingView Lightweight Charts
 * Handles chart rendering with native mobile touch support
 */

class ChartManager {
    constructor(chartElementId) {
        this.chartContainer = document.getElementById(chartElementId);
        this.chart = null;
        this.volumeChart = null;
        this.currentData = [];
        this.priceSeries = [];
        this.volumeSeries = [];
    }

    /**
     * Render chart with multiple tickers
     * @param {Array} tickerDataArray - Array of ticker data objects
     * @param {boolean} showVolume - Whether to show volume
     * @param {string} interval - Data interval (1m, 5m, etc.)
     */
    renderChart(tickerDataArray, showVolume = true, interval = '1d') {
        this.currentData = tickerDataArray;
        this.currentInterval = interval;
        this.currentShowVolume = showVolume;

        // Clear existing charts
        this.clear();

        // Determine if showing intraday data
        const isIntraday = ['1m', '5m', '15m', '30m', '60m'].includes(interval);
        const intervalLabel = this.getIntervalLabel(interval);

        // Create container structure
        this.chartContainer.innerHTML = `
            <div class="chart-header">
                <h3>Ticker Comparison - ${intervalLabel}</h3>
            </div>
            <div id="price-chart" class="price-chart-container"></div>
            ${showVolume ? '<div id="volume-chart" class="volume-chart-container"></div>' : ''}
            <div class="chart-legend" id="legend"></div>
        `;

        const priceContainer = document.getElementById('price-chart');
        const volumeContainer = showVolume ? document.getElementById('volume-chart') : null;

        // Chart dimensions
        const priceHeight = showVolume ? 400 : 550;
        const volumeHeight = 150;

        // Create price chart
        this.chart = LightweightCharts.createChart(priceContainer, {
            width: priceContainer.clientWidth,
            height: priceHeight,
            layout: {
                background: { color: '#ffffff' },
                textColor: '#1e293b',
            },
            grid: {
                vertLines: { color: '#f1f5f9' },
                horzLines: { color: '#f1f5f9' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: '#9CA3AF',
                    style: LightweightCharts.LineStyle.Solid,
                },
                horzLine: {
                    width: 1,
                    color: '#9CA3AF',
                    style: LightweightCharts.LineStyle.Solid,
                },
            },
            rightPriceScale: {
                borderColor: '#e2e8f0',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                borderColor: '#e2e8f0',
                timeVisible: isIntraday,
                secondsVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
            },
            handleScroll: false,
            handleScale: false,
        });

        // Create volume chart if needed
        if (showVolume && volumeContainer) {
            this.volumeChart = LightweightCharts.createChart(volumeContainer, {
                width: volumeContainer.clientWidth,
                height: volumeHeight,
                layout: {
                    background: { color: '#ffffff' },
                    textColor: '#1e293b',
                },
                grid: {
                    vertLines: { color: '#f1f5f9' },
                    horzLines: { color: '#f1f5f9' },
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                    vertLine: {
                        width: 1,
                        color: '#9CA3AF',
                        style: LightweightCharts.LineStyle.Solid,
                    },
                    horzLine: {
                        visible: false,
                    },
                },
                rightPriceScale: {
                    borderColor: '#e2e8f0',
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1,
                    },
                },
                timeScale: {
                    borderColor: '#e2e8f0',
                    timeVisible: isIntraday,
                    secondsVisible: false,
                    visible: true,
                    fixLeftEdge: true,
                    fixRightEdge: true,
                },
                handleScroll: false,
                handleScale: false,
            });

            // Note: Crosshair sync between charts can be added later if needed
            // this.syncCharts();
        }

        // Color palette for different tickers
        const colors = [
            '#2563eb', // Blue
            '#dc2626', // Red
            '#16a34a', // Green
            '#ea580c', // Orange
            '#9333ea', // Purple
            '#0891b2', // Cyan
        ];

        // Add series for each ticker
        tickerDataArray.forEach((data, index) => {
            const color = colors[index % colors.length];

            // Add price series (line)
            const lineSeries = this.chart.addSeries(LightweightCharts.LineSeries, {
                color: color,
                lineWidth: 2,
                title: data.ticker,
                priceFormat: {
                    type: 'custom',
                    formatter: (price) => `${price.toFixed(2)}%`,
                },
            });

            // Convert data to TradingView format with actual prices stored
            const priceData = data.dates.map((date, i) => ({
                time: Math.floor(date.getTime() / 1000), // Unix timestamp in seconds
                value: data.percentChange[i],
                customValues: {
                    actualPrice: data.close[i],
                    ticker: data.ticker
                }
            }));

            lineSeries.setData(priceData);
            this.priceSeries.push({
                series: lineSeries,
                ticker: data.ticker,
                color: color,
                actualPrices: data.close // Store actual prices for tooltip
            });

            // Add volume series if needed
            if (showVolume && this.volumeChart) {
                const volumeSeries = this.volumeChart.addSeries(LightweightCharts.HistogramSeries, {
                    color: color,
                    priceFormat: {
                        type: 'volume',
                    },
                    priceScaleId: '',
                });

                const volumeData = data.dates.map((date, i) => ({
                    time: Math.floor(date.getTime() / 1000),
                    value: data.volume[i],
                    color: color + '80', // 50% opacity
                }));

                volumeSeries.setData(volumeData);
                this.volumeSeries.push({ series: volumeSeries, ticker: data.ticker, color: color });
            }
        });

        // Fit content
        this.chart.timeScale().fitContent();
        if (this.volumeChart) {
            this.volumeChart.timeScale().fitContent();
        }

        // Create legend
        this.createLegend();

        // Setup tooltip
        this.setupTooltip(tickerDataArray);

        // Handle resize
        this.setupResize();
    }

    /**
     * Sync crosshair movement between price and volume charts
     */
    syncCharts() {
        if (!this.chart || !this.volumeChart) return;

        // Sync crosshair between charts
        this.chart.subscribeCrosshairMove((param) => {
            this.volumeChart.timeScale().applyOptions({
                rightOffset: this.chart.timeScale().scrollPosition()
            });
        });

        this.volumeChart.subscribeCrosshairMove((param) => {
            this.chart.timeScale().applyOptions({
                rightOffset: this.volumeChart.timeScale().scrollPosition()
            });
        });
    }

    /**
     * Create interactive legend
     */
    createLegend() {
        const legendContainer = document.getElementById('legend');
        if (!legendContainer) return;

        legendContainer.innerHTML = '';

        this.priceSeries.forEach(({ ticker, color }) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.id = `legend-${ticker}`;
            legendItem.innerHTML = `
                <span class="legend-color" style="background-color: ${color}"></span>
                <span class="legend-ticker">${ticker}</span>
                <span class="legend-values"></span>
            `;
            legendContainer.appendChild(legendItem);
        });
    }

    /**
     * Setup tooltip that shows actual prices on hover
     */
    setupTooltip(tickerDataArray) {
        if (!this.chart) return;

        // Create map for quick lookup of actual prices by time
        const priceMap = {};
        tickerDataArray.forEach(data => {
            data.dates.forEach((date, i) => {
                const time = Math.floor(date.getTime() / 1000);
                if (!priceMap[time]) {
                    priceMap[time] = {};
                }
                priceMap[time][data.ticker] = data.close[i];
            });
        });

        // Subscribe to crosshair movement
        this.chart.subscribeCrosshairMove((param) => {
            console.log('Crosshair move:', param);

            if (!param || !param.time) {
                // Reset legend to just show ticker names
                this.priceSeries.forEach(({ ticker }) => {
                    const legendItem = document.getElementById(`legend-${ticker}`);
                    if (legendItem) {
                        const valuesSpan = legendItem.querySelector('.legend-values');
                        if (valuesSpan) {
                            valuesSpan.textContent = '';
                        }
                    }
                });
                return;
            }

            // Update legend with current values
            this.priceSeries.forEach(({ series, ticker }) => {
                const legendItem = document.getElementById(`legend-${ticker}`);
                const actualPrice = priceMap[param.time]?.[ticker];

                console.log('Updating legend for', ticker, 'price:', actualPrice, 'time:', param.time);

                if (legendItem && actualPrice !== undefined) {
                    const valuesSpan = legendItem.querySelector('.legend-values');

                    // Get the percentage change from the chart data
                    const seriesData = param.seriesData?.get(series);
                    const percentChange = seriesData?.value;

                    console.log('Series data:', seriesData, 'percentChange:', percentChange);

                    if (valuesSpan) {
                        if (percentChange !== undefined) {
                            valuesSpan.textContent = ` $${actualPrice.toFixed(2)} (${percentChange.toFixed(2)}%)`;
                        } else {
                            valuesSpan.textContent = ` $${actualPrice.toFixed(2)}`;
                        }
                    }
                }
            });
        });
    }

    /**
     * Setup responsive resize handling
     */
    setupResize() {
        const resizeObserver = new ResizeObserver(entries => {
            if (this.chart) {
                const priceContainer = document.getElementById('price-chart');
                if (priceContainer) {
                    this.chart.applyOptions({
                        width: priceContainer.clientWidth
                    });
                }
            }
            if (this.volumeChart) {
                const volumeContainer = document.getElementById('volume-chart');
                if (volumeContainer) {
                    this.volumeChart.applyOptions({
                        width: volumeContainer.clientWidth
                    });
                }
            }
        });

        if (document.getElementById('price-chart')) {
            resizeObserver.observe(document.getElementById('price-chart'));
        }
        if (document.getElementById('volume-chart')) {
            resizeObserver.observe(document.getElementById('volume-chart'));
        }

        // Store for cleanup
        this.resizeObserver = resizeObserver;
    }

    /**
     * Get interval label for chart title
     */
    getIntervalLabel(interval) {
        const labels = {
            '1m': '1-Minute (Includes Pre/After Hours)',
            '5m': '5-Minute (Includes Pre/After Hours)',
            '15m': '15-Minute',
            '30m': '30-Minute',
            '60m': 'Hourly',
            '1d': 'Daily'
        };
        return labels[interval] || interval;
    }

    /**
     * Clear the chart
     */
    clear() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.chart) {
            this.chart.remove();
            this.chart = null;
        }

        if (this.volumeChart) {
            this.volumeChart.remove();
            this.volumeChart = null;
        }

        this.priceSeries = [];
        this.volumeSeries = [];
        this.currentData = [];

        if (this.chartContainer) {
            this.chartContainer.innerHTML = '';
        }
    }

    /**
     * Toggle volume visibility
     */
    toggleVolume(showVolume) {
        console.log('toggleVolume called with:', showVolume);
        console.log('currentData:', this.currentData);
        console.log('currentInterval:', this.currentInterval);

        // Just re-render with new setting
        if (this.currentData && this.currentData.length > 0 && this.currentInterval) {
            console.log('Re-rendering chart...');
            this.renderChart(this.currentData, showVolume, this.currentInterval);
        } else {
            console.error('Cannot toggle volume - missing data or interval');
        }
    }
}
