/**
 * Chart Manager
 * Handles Plotly.js chart rendering
 */

class ChartManager {
    constructor(chartElementId) {
        this.chartElement = document.getElementById(chartElementId);
        this.currentData = [];
    }

    /**
     * Render chart with multiple tickers
     * @param {Array} tickerDataArray - Array of ticker data objects
     * @param {boolean} showVolume - Whether to show volume
     * @param {string} interval - Data interval (1m, 5m, etc.)
     */
    renderChart(tickerDataArray, showVolume = true, interval = '1d') {
        this.currentData = tickerDataArray;

        const traces = [];

        // Price traces (percent change) - main chart
        tickerDataArray.forEach((data, index) => {
            traces.push({
                x: data.dates,
                y: data.percentChange,
                name: data.ticker,
                type: 'scatter',
                mode: 'lines',
                line: {
                    width: 2,
                    shape: 'spline',
                    smoothing: 1.0
                },
                xaxis: 'x',
                yaxis: 'y',
                customdata: data.close,
                hovertemplate: '<b>%{fullData.name}</b><br>' +
                              'Price: $%{customdata:.2f}<br>' +
                              'Change: %{y:.2f}%<br>' +
                              '<extra></extra>'
            });
        });

        // Volume traces - separate subplot below
        if (showVolume) {
            tickerDataArray.forEach((data, index) => {
                traces.push({
                    x: data.dates,
                    y: data.volume,
                    name: `${data.ticker} Vol`,
                    type: 'bar',
                    xaxis: 'x2',
                    yaxis: 'y2',
                    opacity: 0.5,
                    showlegend: false,
                    hovertemplate: '<b>%{fullData.name}</b><br>' +
                                  'Volume: %{y:,.0f}<br>' +
                                  '<extra></extra>'
                });
            });
        }

        // Determine if showing intraday data
        const isIntraday = ['1m', '5m', '15m', '30m', '60m'].includes(interval);
        const intervalLabel = this.getIntervalLabel(interval);

        const layout = {
            title: `Ticker Comparison - ${intervalLabel}`,
            hovermode: 'x unified',
            dragmode: false,
            xaxis: {
                title: '',
                type: 'date',
                showticklabels: false,
                domain: [0, 1],
                anchor: 'y',
                showspikes: true,
                spikemode: 'across',
                spikesnap: 'cursor',
                spikecolor: '#999',
                spikethickness: 1,
                spikedash: 'solid',
                fixedrange: true
            },
            xaxis2: {
                title: isIntraday ? 'Date & Time (ET)' : 'Date',
                type: 'date',
                domain: [0, 1],
                anchor: 'y2',
                matches: 'x',
                showspikes: true,
                spikemode: 'across',
                spikesnap: 'cursor',
                spikecolor: '#999',
                spikethickness: 1,
                spikedash: 'solid',
                fixedrange: true
            },
            yaxis: {
                title: 'Price Change (%)',
                domain: showVolume ? [0.35, 1] : [0, 1],
                showgrid: true,
                zeroline: true,
                fixedrange: true,
                anchor: 'x'
            },
            yaxis2: {
                title: showVolume ? 'Volume' : '',
                domain: showVolume ? [0, 0.28] : [0, 0],
                showgrid: false,
                fixedrange: true,
                anchor: 'x2',
                visible: showVolume
            },
            legend: {
                orientation: 'h',
                yanchor: 'top',
                y: -0.15,
                xanchor: 'center',
                x: 0.5,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#e2e8f0',
                borderwidth: 1
            },
            margin: { t: 60, b: 100, l: 60, r: 60 },
            autosize: true
        };

        // Remove gaps - collect all actual data points and hide everything else
        const allDates = new Set();
        tickerDataArray.forEach(data => {
            data.dates.forEach(date => allDates.add(date.getTime()));
        });

        const sortedDates = Array.from(allDates).sort((a, b) => a - b);
        const rangebreaks = [];

        // Find gaps between consecutive data points
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const gapMs = currDate - prevDate;

            // If gap is more than expected interval, add rangebreak
            const expectedGapMs = this.getExpectedGapMs(interval);
            if (gapMs > expectedGapMs * 1.5) {
                rangebreaks.push({
                    bounds: [prevDate, currDate]
                });
            }
        }

        layout.xaxis.rangebreaks = rangebreaks;
        layout.xaxis2.rangebreaks = rangebreaks;

        // Add shaded regions for market sessions (intraday only)
        if (isIntraday) {
            layout.shapes = this.getMarketSessionShapes(tickerDataArray);
            layout.annotations = [
                {
                    x: 0.5,
                    y: 1.05,
                    xref: 'paper',
                    yref: 'paper',
                    text: '🔵 Pre-Market (4-9:30am) | ⚪ Market (9:30am-4pm) | 🟠 After-Hours (4-8pm)',
                    showarrow: false,
                    font: { size: 10, color: '#64748b' },
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderpad: 4,
                    xanchor: 'center',
                    yanchor: 'bottom'
                }
            ];
        }

        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'select2d', 'lasso2d', 'pan2d'],
            scrollZoom: false,
            doubleClick: false,
            staticPlot: false
        };

        Plotly.newPlot(this.chartElement, traces, layout, config);
    }

    /**
     * Get expected gap in milliseconds for an interval
     */
    getExpectedGapMs(interval) {
        const gaps = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '60m': 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000
        };
        return gaps[interval] || 60 * 1000;
    }

    /**
     * Generate market session background shapes
     * Pre-market: 4:00-9:30 AM ET (light blue)
     * Market hours: 9:30 AM-4:00 PM ET (transparent/white)
     * After-hours: 4:00-8:00 PM ET (light orange)
     */
    getMarketSessionShapes(tickerDataArray) {
        if (tickerDataArray.length === 0) return [];

        const shapes = [];
        const dates = tickerDataArray[0].dates;

        // Find unique trading days
        const tradingDays = new Set();
        dates.forEach(date => {
            const dayStr = date.toISOString().split('T')[0];
            tradingDays.add(dayStr);
        });

        // For each trading day, add session backgrounds
        tradingDays.forEach(dayStr => {
            const dayDate = new Date(dayStr + 'T00:00:00');

            // Pre-market: 4:00 AM - 9:30 AM ET
            shapes.push({
                type: 'rect',
                xref: 'x',
                yref: 'y domain',
                x0: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 4, 0),
                x1: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 9, 30),
                y0: 0,
                y1: 1,
                fillcolor: 'rgba(135, 206, 250, 0.15)', // Light blue
                line: { width: 0 },
                layer: 'below'
            });

            // After-hours: 4:00 PM - 8:00 PM ET
            shapes.push({
                type: 'rect',
                xref: 'x',
                yref: 'y domain',
                x0: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 16, 0),
                x1: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 20, 0),
                y0: 0,
                y1: 1,
                fillcolor: 'rgba(255, 165, 0, 0.15)', // Light orange
                line: { width: 0 },
                layer: 'below'
            });
        });

        return shapes;
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
        if (this.chartElement) {
            Plotly.purge(this.chartElement);
        }
        this.currentData = [];
    }

    /**
     * Toggle volume visibility
     */
    toggleVolume(showVolume) {
        // Check if chart has been rendered
        if (!this.chartElement.data || this.chartElement.data.length === 0 || this.currentData.length === 0) {
            return;
        }

        const priceTraceCount = this.currentData.length;
        const totalTraces = this.chartElement.data.length;

        if (totalTraces <= priceTraceCount) {
            // No volume traces
            return;
        }

        // Volume traces start after price traces
        const volumeIndices = [];
        for (let i = priceTraceCount; i < totalTraces; i++) {
            volumeIndices.push(i);
        }

        // Update visibility
        const update = {
            visible: showVolume
        };

        Plotly.restyle(this.chartElement, update, volumeIndices);

        // Adjust layout to hide/show volume subplot
        const layoutUpdate = {
            'yaxis.domain': showVolume ? [0.35, 1] : [0, 1],
            'yaxis2.domain': showVolume ? [0, 0.28] : [0, 0],
            'yaxis2.visible': showVolume,
            'yaxis2.title': showVolume ? 'Volume' : ''
        };

        Plotly.relayout(this.chartElement, layoutUpdate);
    }
}
