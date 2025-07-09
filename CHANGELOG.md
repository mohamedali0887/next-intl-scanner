# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2025-07-09

### Fixed
- Fixed a bug where the scanner would not work with custom jsx elements




## [1.1.6] - 2025-07-09

### Added
- Enhanced custom hook extraction with robust quote handling
- Support for translation strings containing single quotes, double quotes, and escaped quotes
- Comprehensive test cases for various quote scenarios

### Fixed
- Custom hook namespace extraction now properly nests translations under their respective namespaces
- Regex patterns now handle complex quote patterns in translation strings
- **Fixed false positive regex matching** - extractor now only processes actual `t()` calls, eliminating false warnings about dots in non-translation strings
- Improved extraction reliability for real-world translation scenarios

### Changed
- Standardized on custom translation hook usage for consistent extraction
- Updated test components to use only custom hooks for better maintainability
- **Regex patterns now specifically target `t()` calls** instead of generic function calls, improving accuracy and performance

## [1.1.5]
### Fixed 
- Node v24 compatibility
- Issues with ' breaking translations 



## [1.1.4] - 2025-06-17

### Added
- Namespace extraction now supports both `useTranslations` (client) and server-side `getTranslations(locale, 'namespace')` patterns.

## [1.1.3] - 2025-04-22

### Fixed

- Fixed a bug where the scanner would not work with custom jsx elements
- Translation will be done in chunks of 100 strings to avoid rate limiting

## [1.1.2] - 2024-03-19

### Removed

- Custom Hooks , and added the useTranslations hook to the readme file

### Fixed

- Fixed a bug where the scanner would not work with custom jsx elements
- fixed a memory leak

## [1.1.0] - 2024-03-19

### Added

- Support for preserving existing translations by default
- Improved translation extraction with better namespace handling
- Enhanced auto-translation capabilities
- Better error handling and logging

### Changed

- Default behavior now preserves existing translations
- Improved type safety and error handling
- Updated dependencies to latest versions

### Fixed

- Fixed issues with translation preservation
- Improved handling of nested translations
- Better error messages for common issues

## [1.0.16] - 2024-03-18

### Added

- Initial release with basic translation extraction
- Support for auto-translation using Google Translate API
- Configuration file support
- Custom JSX component pattern support
