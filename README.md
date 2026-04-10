# 📊 Ticker Comparison Dashboard

Interactive web dashboard to compare multiple stock tickers side-by-side.

## Features

- ✅ Compare unlimited tickers simultaneously
- ✅ **Granular intervals**: 1-minute, 5-minute, 15-minute, 30-minute, hourly, or daily data
- ✅ **Auto-interval detection**: Automatically picks optimal granularity based on date range
- ✅ **Intraday data**: See pre-market and after-hours trading with minute-level data
- ✅ Interactive charts with zoom/pan
- ✅ Volume visualization
- ✅ Percentage change comparison from selected date range
- ✅ Mobile-first responsive design
- ✅ PWA installable on phone/desktop
- ✅ No backend required - runs entirely in browser

## Quick Start (Local)

### Option 1: Direct File Open
1. Navigate to the folder:
   ```bash
   cd ticker_comparison_dashboard
   ```

2. Open `index.html` in your browser:
   - **macOS**: `open index.html`
   - **Windows**: `start index.html`
   - **Linux**: `xdg-open index.html`

### Option 2: Local Server (Recommended)
For best experience (avoids CORS issues), run a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Then visit: http://localhost:8000
```

Or with Node.js:
```bash
npx http-server -p 8000
```

## Usage

1. **Add Tickers**: Enter stock symbols (e.g., AAPL, TSLA, MSFT) - press Enter to add another
2. **Select Date Range**: Choose start and end dates
3. **Choose Interval** (optional): 
   - **Auto** (default): Smart selection based on date range
   - **Manual**: Pick 1m, 5m, 15m, 30m, 1h, or daily
4. **Update Chart**: Click to fetch data and render (or press Ctrl/Cmd+Enter)
5. **Zoom/Pan**: Use chart controls to zoom and pan
6. **Toggle Volume**: Show/hide volume bars
7. **Change Timeframe**: Adjust date range and update to see different periods
8. **Install on Phone**: Open on mobile → "Add to Home Screen"

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

## How It Works

### Percentage Comparison
All tickers are normalized to % change from the start date:
- First closing price in range = 0%
- All subsequent prices calculated as % change from that baseline
- Allows fair comparison regardless of absolute price differences

### Smart Interval Selection
The dashboard automatically selects the most granular interval Yahoo Finance allows:
- **Short periods** (1 day): 1-minute bars showing pre-market (4am-9:30am ET), regular hours (9:30am-4pm ET), and after-hours (4pm-8pm ET)
- **Medium periods** (1 week - 2 months): 5-minute to 30-minute intraday data
- **Long periods** (1+ years): Daily data for long-term trends

You can override auto-selection and manually choose any interval.

### Data Source
- Uses Yahoo Finance public API
- No API key required
- Real-time market data
- Historical OHLCV data

## Project Structure

```
ticker_comparison_dashboard/
├── index.html              # Main HTML page
├── manifest.json           # PWA configuration
├── css/
│   └── style.css          # Mobile-first responsive styles
├── js/
│   ├── data-fetcher.js    # Yahoo Finance API wrapper
│   ├── chart-manager.js   # Plotly chart + zoom logic
│   └── app.js             # Main application logic
└── README.md              # This file
```

## Deploy to GitHub Pages

### Step 1: Create GitHub Repository
```bash
# In the ticker_comparison_dashboard folder
git init
git add .
git commit -m "Initial commit: Ticker comparison dashboard"
```

### Step 2: Create Repo on GitHub
1. Go to https://github.com/new
2. Name: `ticker-comparison-dashboard`
3. Public repository
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### Step 3: Push to GitHub
```bash
# Link to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ticker-comparison-dashboard.git

# Push code
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to repo → Settings → Pages
2. Source: Deploy from branch
3. Branch: `main` → folder: `/ (root)`
4. Save

### Step 5: Access Your Dashboard
After ~1 minute, visit:
```
https://YOUR_USERNAME.github.io/ticker-comparison-dashboard
```

Share this URL with anyone - works on desktop and mobile!

## Mobile Installation (PWA)

### iPhone/iPad
1. Open dashboard URL in Safari
2. Tap Share button (box with arrow)
3. Scroll down → "Add to Home Screen"
4. App installs with icon on home screen

### Android
1. Open dashboard URL in Chrome
2. Tap menu (3 dots)
3. "Add to Home screen" or "Install app"
4. App installs

## Customization

### Change Default Date Range
Edit `app.js` line 17-18:
```javascript
startDate.setMonth(startDate.getMonth() - 3);  // Change -3 to your preference
```

### Change Theme Colors
Edit `css/style.css` lines 9-16:
```css
:root {
    --primary-color: #2563eb;  /* Change to your color */
    --success-color: #10b981;
    --error-color: #ef4444;
    /* ... */
}
```

### Pre-populate Tickers
Edit `app.js` `addTickerInput()` to set default values.

## Troubleshooting

### Chart Not Loading
- **Issue**: CORS errors in console
- **Fix**: Use local server (see Quick Start Option 2)

### Ticker Not Found
- **Issue**: "Failed to fetch TICKER"
- **Fix**: Verify ticker symbol is correct (use Yahoo Finance symbol)

### Date Range Issues
- **Issue**: No data returned
- **Fix**: Markets are closed on weekends - adjust date range

### Mobile Touch Issues
- **Issue**: Buttons too small
- **Fix**: Already optimized with 44px min touch targets

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (iOS 14+, macOS)
- ✅ Mobile browsers

## License

MIT - Free to use and modify

## Credits

- Data: Yahoo Finance
- Charts: Plotly.js
- Icons: Emoji

---

**Questions?** Open an issue on GitHub or check the code comments.
