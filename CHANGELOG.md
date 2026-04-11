# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
