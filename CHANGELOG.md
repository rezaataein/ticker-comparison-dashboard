# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.7] - 2026-04-13

### Changed
- Display custom icon in header instead of emoji
- Icon now visible in app UI alongside title
- Responsive icon sizing (2rem mobile, 2.5rem desktop)

## [1.2.6] - 2026-04-13

### Added
- Custom PWA icon with three-line chart design (blue, red, green lines)
- Professional app icon replaces emoji for better branding
- Apple touch icon support for iOS devices

### Changed
- New icon.svg file with multi-line ticker comparison visualization
- Updated manifest.json to reference custom icon
- Updated favicon and apple-touch-icon in index.html

## [1.2.5] - 2026-04-11

### Fixed
- **X-axis labels**: 4-month ranges now show dates instead of hours (changed hourly threshold from 365 to 60 days)
- **X-axis alignment**: Price and volume charts now perfectly aligned (fixed width instead of minimumWidth on price scales)

### Changed
- Auto-interval thresholds: 1-7d→5m, 8-14d→15m, 15-30d→30m, 31-60d→60m, 61+d→1d
- Both price scales now use fixed `width: 80` instead of `minimumWidth: 60`
- Ensures identical right-side padding on both charts for perfect x-axis alignment

## [1.2.4] - 2026-04-11

### Fixed
- Tooltip maps (priceMap/volumeMap/percentMap) now filter out null values
- Prevents showing invalid data on hover
- Added cache-busting query parameters to JavaScript files to force browser reload

### Changed
- Only store valid data points in tooltip lookup maps
- Skip null/NaN values when building hover data structures

## [1.2.3] - 2026-04-11

### Fixed
- **CRITICAL**: Filter out null values from Yahoo Finance API responses
- Charts no longer drop to 0% when API returns null close prices (e.g., Jan 30 - Feb 2, 2026)
- Hover tooltip now works correctly at all data points
- Both price and volume data filtered identically to maintain x-axis alignment

### Changed
- Apply .filter() to both priceData and volumeData with same criteria
- Remove null/NaN values before setting chart data
- Clean up debug console logging

### Technical
- Filter chain: .map() → .filter(value != null && !isNaN(value))
- Identical filtering logic ensures price and volume charts stay aligned
- X-axis alignment preserved from v1.2.2

## [1.2.2] - 2026-04-11

### Fixed
- **CRITICAL**: Removed data filtering that was causing different time ranges
- Price and volume charts now show IDENTICAL time ranges
- Both charts have exact same timestamps (no filtering removes different points)

### Changed
- Removed .filter() from priceData and volumeData creation
- Back to simple .map() without filtering (like v1.1.6)
- Charts align perfectly because they have exact same data points

## [1.2.1] - 2026-04-11

### Fixed
- **CRITICAL**: Removed broken syncTimeScales() function that was showing different ranges
- Charts now display correct date ranges again
- Price and volume charts both show same time range naturally

### Removed
- syncTimeScales() function (was causing circular updates and wrong ranges)
- subscribeVisibleLogicalRangeChange() calls (breaking the time scales)

### Technical
- Both charts now just call fitContent() independently
- No sync subscriptions - charts align naturally with same data

## [1.2.0] - 2026-04-11

### Fixed - Major QA Overhaul
- **X-axis alignment**: Set minimumWidth: 60 on both price scales for perfect alignment
- **Date formatting**: Fixed "12:00" showing instead of date - added custom tickMarkFormatter
  - Daily data: Shows "Apr 11" format
  - Intraday data: Shows "14:30" format (24-hour time)
- **Missing hover data**: Filter out null/undefined/NaN values before creating chart data
- **Infinite loop**: Fixed syncTimeScales with isSyncing flag to prevent circular updates
- **Data quality**: Validate all data points before adding to charts (price, volume, percentChange)

### Changed
- Moved syncTimeScales to after fitContent() for proper initialization
- Filter priceData and volumeData to only include valid points
- Improved data validation throughout tooltip logic

### Technical
- Set rightPriceScale.minimumWidth: 60 on both charts
- Custom tickMarkFormatter for proper date/time display
- Filter chain: map → filter(valid) → setData
- Prevent sync loop with shared isSyncing flag

## [1.1.7] - 2026-04-11

### Fixed
- **X-axis alignment**: Price and volume charts now perfectly aligned
- Time scales synced using subscribeVisibleLogicalRangeChange
- Scrolling/zooming one chart updates the other automatically

### Technical
- Replaced broken syncCharts with proper syncTimeScales
- Uses TradingView's visible logical range subscription
- Both charts maintain identical time ranges

## [1.1.6] - 2026-04-11

### Fixed
- **MAJOR**: Volume hover now shows VOLUME data instead of prices
- Fixed all null reference errors with defensive data validation
- Created separate maps for prices, volumes, and percentages

### Changed
- Price chart hover: Shows "$175.43 (2.35%)"
- Volume chart hover: Shows "Vol: 1,234,567 | $175.43"
- Both price and volume data properly formatted and validated

## [1.1.5] - 2026-04-11

### Fixed
- Volume hover now works - added crosshair subscription to volume chart
- Fixed null/NaN errors by validating data when building priceMap
- Added isNaN checks in addition to null checks for robust error handling
- Legend updates when hovering over either price or volume chart

### Added
- Volume chart now has its own crosshair move handler
- Synced tooltip updates between price and volume charts

## [1.1.4] - 2026-04-11

### Fixed
- Fixed null reference error in tooltip (was checking !== undefined, should check != null)
- Now properly handles both null and undefined values for actualPrice and percentChange

## [1.1.3] - 2026-04-11

### Fixed
- **CRITICAL**: Fixed data storage bug where currentData was cleared immediately after being set
- Volume toggle now works - data is preserved for re-rendering
- Legend tooltip now shows prices and percentages correctly
- Moved data assignment to AFTER clear() instead of before

### Technical
- Bug was caused by setting this.currentData before calling this.clear()
- clear() was resetting currentData to empty array
- Now clears first, then sets data

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
