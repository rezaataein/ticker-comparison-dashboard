# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-04-11

### Added
- Actual stock prices now shown in legend on hover/crosshair move
- Format: TICKER $123.45 (5.67%) - shows both actual price and percentage change
- Interactive legend updates dynamically as you move crosshair

## [1.1.1] - 2026-04-11

### Fixed
- Fixed TradingView API method calls (addSeries instead of addLineSeries/addHistogramSeries)
- Chart now renders correctly with proper API syntax

## [1.1.0] - 2026-04-11

### Changed
- **MAJOR**: Switched from Plotly.js to TradingView Lightweight Charts
- Native mobile touch support with crosshair - works out of the box
- Sticky hover now works perfectly on mobile (drag finger to see values)
- Volume hover works automatically with synced crosshair
- Cleaner, more professional chart appearance
- Better performance on mobile devices

### Fixed
- Mobile sticky hover - no longer requires workarounds
- Volume crosshair now synced with price chart
- Touch interactions work immediately on contact (not on release)
- All mobile touch issues resolved with purpose-built financial chart library

### Technical
- Replaced Plotly.js with TradingView Lightweight Charts (purpose-built for financial data)
- Charts now sync crosshair movement between price and volume panes
- Simplified codebase - removed all custom touch event handlers
- Better suited for mobile-first financial charting

## [1.0.6] - 2026-04-11

### Fixed
- Volume hover now works - enabled spikes on xaxis2
- Sticky hover implemented using hybrid approach: touch events trigger synthetic mousemove events
- Hover stays visible while dragging finger (Yahoo Finance style)
- Removed debug console logging

### Changed
- Touch events now dispatch synthetic mousemove to trigger Plotly's native hover system
- Hover persists after lifting finger (truly sticky)

## [1.0.5] - 2026-04-11

### Fixed
- Fixed mobile hover by changing dragmode from false to 'pan' (allows Plotly's native touch hover)
- Added hoverdistance: 50 for better touch target sizing on mobile
- Removed custom touch handlers that were interfering with Plotly's native hover
- Added debug logging to volume toggle for troubleshooting

### Changed
- Now uses Plotly's native touch/hover handling instead of custom implementation
- Chart remains fixed (no zoom/pan) via fixedrange: true on all axes

## [1.0.4] - 2026-04-11

### Fixed
- Hover now appears immediately on touch (not just when lifting finger) for true sticky behavior
- Volume toggle now properly re-renders chart to show/hide volume traces

## [1.0.3] - 2026-04-11

### Fixed
- Volume hover now works across both price and volume subplots (added hoversubplots: 'axis')
- Volume toggle properly shows/hides using Plotly.restyle + Plotly.relayout instead of full re-render
- Implemented custom touch event handlers for sticky hover behavior (drag to see values like Yahoo Finance)

## [1.0.2] - 2026-04-11

### Fixed
- Completely disabled blue selection highlighting on all clicks
- Fixed volume toggle to properly re-render chart instead of just hiding
- Improved hover stickiness by changing hovermode and spike display
- Removed toolbar completely for cleaner mobile experience
- Fixed touch-action to allow smooth vertical scrolling while enabling hover

### Changed
- Re-enabled text selection only for input fields
- Stored current interval in ChartManager for proper toggle functionality
- Increased spike thickness for better visibility

## [1.0.1] - 2026-04-11

### Fixed
- Volume bars now display correctly in separate subplot
- Fixed volume toggle checkbox functionality
- Sticky hover behavior - tooltip follows touch/drag like Yahoo Finance
- Improved mobile touch interaction with smooth dragging

### Changed
- Adjusted chart spacing for better volume visualization
- Removed pan controls, kept hover-only interaction
- Disabled all zoom functionality for cleaner UX

## [1.0.0] - 2026-04-10

### Added
- Initial release
- Multi-ticker comparison with percentage normalization
- Granular intervals: 1m, 5m, 15m, 30m, 1h, daily
- Smart auto-interval selection based on date range
- Extended hours visualization (pre-market, after-hours)
- Interactive charts with Plotly.js
- Volume visualization in separate subplot
- Mobile-first responsive design
- PWA support for installation on mobile/desktop
- Dynamic gap removal for weekends and non-trading hours
- Market session highlighting (blue for pre-market, orange for after-hours)
- Keyboard shortcuts (Enter to add ticker, Cmd/Ctrl+Enter to update)
- Version tracking in footer
- Professional README and documentation
- MIT License

### Technical
- No backend required - runs entirely in browser
- Yahoo Finance API integration via CORS proxy
- Spline smoothing for chart lines
- Touch-optimized mobile interactions
