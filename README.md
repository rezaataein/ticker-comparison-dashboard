# 📊 Ticker Comparison Dashboard

A lightweight, browser-based stock ticker comparison tool with granular intraday data visualization. Compare multiple tickers side-by-side with automatic baseline normalization and smart interval selection.

## 🚀 Live Demo

**[View Dashboard →](https://yourusername.github.io/ticker-comparison-dashboard)** *(Replace with your GitHub Pages URL)*

Works on desktop, tablet, and mobile. Install as a PWA for app-like experience.

<!-- Screenshot placeholder - uncomment and add screenshot
![Dashboard Screenshot](screenshot.png)
-->

## ✨ Features

- **Multi-ticker comparison** - Compare unlimited tickers simultaneously
- **Granular intervals** - 1-minute, 5-minute, 15-minute, 30-minute, hourly, or daily data
- **Smart auto-detection** - Automatically selects optimal interval based on date range
- **Extended hours** - Pre-market (4am-9:30am) and after-hours (4pm-8pm) data for intraday intervals
- **Interactive charts** - Zoom, pan, and unified hover tooltips showing all ticker prices
- **Volume visualization** - Separate volume subplot with synchronized crosshair
- **Percentage normalization** - Fair comparison regardless of absolute price differences
- **Mobile-first design** - Responsive layout optimized for phones and tablets
- **PWA installable** - Add to home screen for offline-capable app experience
- **No backend required** - Runs entirely in browser using Yahoo Finance API

## 🏃 Quick Start

### Run Locally

**Recommended:** Use a local server to avoid CORS issues:

```bash
# Clone or download this repository
cd ticker-comparison-dashboard

# Start local server (Python 3)
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Open in browser
open http://localhost:8000
```

**Alternative:** Open `index.html` directly in your browser (may have CORS limitations).

## 📖 Usage

1. **Add Tickers** - Enter stock symbols (e.g., AAPL, TSLA, MSFT). Press Enter to add another.
2. **Select Date Range** - Choose start and end dates using the date pickers.
3. **Choose Interval** (optional):
   - **Auto** (default) - Smart selection based on date range
   - **Manual** - Pick 1m, 5m, 15m, 30m, 1h, or daily
4. **Update Chart** - Click "Update Chart" or press `Ctrl/Cmd+Enter`
5. **Interact with Chart**:
   - Hover to view prices and volumes for all tickers at that timestamp
   - Zoom/pan using chart controls
   - Toggle volume visibility with checkbox
6. **Mobile** - Open URL on mobile → Tap "Add to Home Screen" to install as app

### Keyboard Shortcuts

- `Enter` in ticker input → Add new ticker field
- `Ctrl/Cmd + Enter` → Update chart

### Interval Guide

| Date Range | Auto Interval | Detail Level |
|------------|---------------|--------------|
| 1 day | 1-minute | Every minute (includes pre/after market) |
| 2-7 days | 5-minute | Every 5 minutes |
| 8-30 days | 15-minute | Every 15 minutes |
| 31-60 days | 30-minute | Every 30 minutes |
| 61-365 days | 1-hour | Hourly bars |
| 365+ days | Daily | Daily close |

### Yahoo Finance Interval Limits

When manually selecting intervals, note these maximum date ranges:

| Interval | Maximum Range | Use Case |
|----------|---------------|----------|
| 1-minute | 7 days | Intraday single week, includes extended hours |
| 5-minute | 60 days | Short-term intraday analysis |
| 15-minute | 60 days | Medium-term intraday patterns |
| 30-minute | 60 days | Broader intraday view |
| 1-hour | 730 days (2 years) | Long-term intraday trends |
| Daily | Unlimited | Historical analysis |

**The dashboard automatically disables incompatible intervals** based on your selected date range.

## 💡 How It Works

### Percentage Normalization
All tickers are normalized to percentage change from the selected start date, enabling fair comparison regardless of absolute price differences. The first closing price in the range equals 0%, with all subsequent prices calculated relative to that baseline.

### Smart Interval Selection
The dashboard automatically selects the most granular interval supported by Yahoo Finance for your date range:

- **1 day** → 1-minute bars (includes pre-market 4am-9:30am, market hours 9:30am-4pm, after-hours 4pm-8pm ET)
- **2-7 days** → 5-minute bars
- **8-30 days** → 15-minute bars
- **31-60 days** → 30-minute bars
- **61-365 days** → Hourly bars
- **365+ days** → Daily bars

Manual interval override is available. Invalid intervals are automatically disabled based on your date range.

### Visual Enhancements
- **Extended hours highlighting** - Pre-market (blue) and after-hours (orange) periods visually distinguished on intraday charts
- **Gap removal** - Non-trading hours and weekends dynamically hidden for cleaner visualization
- **Unified tooltips** - Hover anywhere to see all ticker prices and volumes at that timestamp with vertical crosshair

## 📁 Project Structure

```
ticker-comparison-dashboard/
├── index.html              # Main HTML page
├── manifest.json           # PWA configuration
├── css/
│   └── style.css          # Mobile-first responsive styles
├── js/
│   ├── data-fetcher.js    # Yahoo Finance API integration
│   ├── chart-manager.js   # Plotly.js chart rendering and interaction
│   └── app.js             # Application logic and UI management
└── README.md
```

## 🌐 Deployment

### GitHub Pages

This repository is configured for GitHub Pages deployment:

1. Go to **Settings** → **Pages**
2. Set **Source** to "Deploy from branch"
3. Select branch: `main`, folder: `/ (root)`
4. Click **Save**

Your dashboard will be live at: `https://YOUR_USERNAME.github.io/ticker-comparison-dashboard`

**Note:** Repository must be public for free GitHub Pages hosting.

## 📱 Mobile Installation (PWA)

Install as a Progressive Web App for offline-capable, app-like experience:

**iOS (Safari):**
1. Open dashboard URL in Safari
2. Tap Share button → "Add to Home Screen"
3. App icon appears on home screen

**Android (Chrome):**
1. Open dashboard URL in Chrome
2. Tap menu (⋮) → "Add to Home screen" or "Install app"
3. App icon appears in app drawer

## ⚙️ Customization

**Default date range** - Edit `js/app.js` line ~20:
```javascript
startDate.setMonth(startDate.getMonth() - 3);  // Default: last 3 months
```

**Theme colors** - Edit `css/style.css` CSS variables:
```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --error-color: #ef4444;
}
```

**Pre-populate tickers** - Modify `addTickerInput()` in `js/app.js`

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors / chart not loading | Use local server instead of opening file directly |
| Ticker not found | Verify symbol is correct (use Yahoo Finance symbols) |
| No data returned | Check date range doesn't span only weekends/holidays |
| Interval disabled | Date range exceeds interval limit (see Interval Limits table) |

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Charting:** [Plotly.js](https://plotly.com/javascript/)
- **Data Source:** [Yahoo Finance API](https://finance.yahoo.com)
- **PWA:** Web App Manifest, Service Worker ready

**No build tools, no dependencies, no backend.** Just clone and run.

## 🌍 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 14+, macOS)
- Mobile browsers (iOS Safari, Chrome Android)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT License - Free to use, modify, and distribute.

See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Market data provided by [Yahoo Finance](https://finance.yahoo.com)
- Charts powered by [Plotly.js](https://plotly.com/javascript/)
- CORS proxy by [corsproxy.io](https://corsproxy.io)

## 📞 Support

- **Issues:** [Report bugs or request features](../../issues)
- **Discussions:** [Ask questions or share ideas](../../discussions)
- **Pull Requests:** Contributions welcome!

---

**Built with ❤️ for traders and investors**
