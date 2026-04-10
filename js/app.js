/**
 * Main Application
 * Handles UI interactions and coordinates data fetching and charting
 */

class TickerDashboard {
    constructor() {
        this.dataFetcher = new DataFetcher();
        this.chartManager = new ChartManager('chart');
        this.showVolume = true;

        this.initializeUI();
        this.attachEventListeners();
    }

    initializeUI() {
        // Set default date range (last 3 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        document.getElementById('startDate').valueAsDate = startDate;
        document.getElementById('endDate').valueAsDate = endDate;

        // Add initial ticker input
        this.addTickerInput();

        // Update interval options based on default date range
        this.updateIntervalOptions();
    }

    attachEventListeners() {
        // Add ticker button
        document.getElementById('addTickerBtn').addEventListener('click', () => {
            this.addTickerInput(true); // Auto-focus new input
        });

        // Update chart button
        document.getElementById('updateChartBtn').addEventListener('click', () => {
            this.updateChart();
        });

        // Toggle volume checkbox
        document.getElementById('toggleVolume').addEventListener('change', (e) => {
            this.showVolume = e.target.checked;
            this.chartManager.toggleVolume(this.showVolume);
        });

        // Clear chart button
        document.getElementById('clearChartBtn').addEventListener('click', () => {
            this.clearChart();
        });

        // Date change - update interval options
        document.getElementById('startDate').addEventListener('change', () => {
            this.updateIntervalOptions();
        });

        document.getElementById('endDate').addEventListener('change', () => {
            this.updateIntervalOptions();
        });

        // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to update chart
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.updateChart();
            }
        });
    }

    addTickerInput(autoFocus = false) {
        const container = document.getElementById('tickerInputs');
        const tickerCount = container.children.length;

        const tickerDiv = document.createElement('div');
        tickerDiv.className = 'ticker-input-group';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ticker-input';
        input.placeholder = `Ticker ${tickerCount + 1} (e.g., AAPL)`;
        input.style.textTransform = 'uppercase';

        // Auto-uppercase as user types
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Enter key adds new ticker
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTickerInput(true);
            }
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-ticker-btn';
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove ticker';
        removeBtn.onclick = () => {
            if (container.children.length > 1) {
                container.removeChild(tickerDiv);
            }
        };

        tickerDiv.appendChild(input);
        tickerDiv.appendChild(removeBtn);
        container.appendChild(tickerDiv);

        // Auto-focus if requested
        if (autoFocus) {
            input.focus();
        }
    }

    getTickersFromInputs() {
        const inputs = document.querySelectorAll('.ticker-input');
        const tickers = [];

        inputs.forEach(input => {
            const ticker = input.value.trim().toUpperCase();
            // Validate: non-empty, alphanumeric only, reasonable length
            if (ticker && /^[A-Z0-9]{1,10}$/.test(ticker) && !tickers.includes(ticker)) {
                tickers.push(ticker);
            }
        });

        return tickers;
    }

    /**
     * Update interval dropdown options based on current date range
     */
    updateIntervalOptions() {
        const startDate = document.getElementById('startDate').valueAsDate;
        const endDate = document.getElementById('endDate').valueAsDate;

        if (!startDate || !endDate) {
            return;
        }

        const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
        const limits = this.dataFetcher.getIntervalLimits();

        const intervalSelect = document.getElementById('intervalSelect');
        const options = intervalSelect.querySelectorAll('option');

        options.forEach(option => {
            const interval = option.value;

            if (interval === 'auto') {
                option.disabled = false;
                return;
            }

            // Check if interval is valid for current range
            if (days > limits[interval]) {
                option.disabled = true;
                option.textContent = option.textContent.split(' (')[0] + ` (max ${limits[interval]} days)`;
            } else {
                option.disabled = false;
                option.textContent = option.textContent.split(' (')[0];
            }
        });

        // If current selection is now invalid, reset to auto
        if (intervalSelect.value !== 'auto' && intervalSelect.options[intervalSelect.selectedIndex].disabled) {
            intervalSelect.value = 'auto';
        }
    }

    async updateChart() {
        // Get tickers
        const tickers = this.getTickersFromInputs();

        if (tickers.length === 0) {
            this.showError('Please enter at least one ticker symbol');
            return;
        }

        // Get date range
        const startDate = document.getElementById('startDate').valueAsDate;
        const endDate = document.getElementById('endDate').valueAsDate;

        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }

        if (startDate >= endDate) {
            this.showError('Start date must be before end date');
            return;
        }

        // Get interval selection
        const intervalSelect = document.getElementById('intervalSelect').value;
        const interval = intervalSelect === 'auto' ? null : intervalSelect;

        // Show loading
        this.showLoading(true);
        this.clearError();

        try {
            // Validate interval before fetching
            if (interval) {
                const isValid = this.dataFetcher.isIntervalValid(interval, startDate, endDate);
                if (!isValid) {
                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                    const limits = this.dataFetcher.getIntervalLimits();
                    this.showError(`${interval} interval supports max ${limits[interval]} days, but your range is ${days} days. Please use Auto or select a compatible interval.`);
                    this.showLoading(false);
                    return;
                }
            }

            // Fetch data for all tickers
            const result = await this.dataFetcher.fetchMultipleTickers(
                tickers,
                startDate,
                endDate,
                interval
            );

            if (result.successful.length === 0) {
                this.showError('Failed to load data for any ticker. Check symbols and try again.');
                return;
            }

            // Render chart
            this.chartManager.renderChart(result.successful, this.showVolume, result.interval);

            // Show success/warning message
            const intervalDesc = this.dataFetcher.getIntervalDescription(result.interval);
            let message = `Loaded ${result.successful.length} ticker(s): ${result.successful.map(d => d.ticker).join(', ')}`;
            message += `\n📊 Interval: ${intervalDesc}`;

            if (result.failures.length > 0) {
                message += `\n⚠️ Failed: ${result.failures.map(f => f.ticker).join(', ')}`;
            }

            this.showSuccess(message);

        } catch (error) {
            console.error('Error updating chart:', error);
            this.showError('Failed to load data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    clearChart() {
        this.chartManager.clear();
        this.clearError();
        this.clearSuccess();
    }

    showLoading(show) {
        const loader = document.getElementById('loader');
        const updateBtn = document.getElementById('updateChartBtn');

        if (show) {
            loader.style.display = 'block';
            updateBtn.disabled = true;
            updateBtn.textContent = 'Loading...';
        } else {
            loader.style.display = 'none';
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update Chart';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }

    clearSuccess() {
        const successDiv = document.getElementById('successMessage');
        successDiv.style.display = 'none';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TickerDashboard();
});
