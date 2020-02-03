# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Logging improvements

### Changed
- Refactored to use vinyl-fs internally

### Fixed
- Fixed issues around handling of paths and virtual path mapping resolutions.

## [0.2.0] - 2020-01-22

### Added
- Customisation of used current working directory.
- Support for logging integration.

### Changed
- Virtual path mapping input must now be an array of objects, and its required.

## [0.1.1] - 2019-12-30

Maintenance release.

- Bumped dependency versions
- Applied fix for type validation in unit tests
- Updated Travis test matrix to reflect supported versions of NodeJS

## [0.1.0] - 2019-07-28

Initial release.
