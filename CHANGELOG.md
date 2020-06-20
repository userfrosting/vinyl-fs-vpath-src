# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Formalized error for when a previously resolved file fails to be loaded.

## [1.0.0] - 2020-03-14

### Changed
- Renamed interface `IVirtPathMapping` to `IPathMapper`.
- Renamed configuration property `virtPathMaps` to `pathMappings`.

### Fixed
- Moved required dependency into package dependencies from dev dependencies.

## [1.0.0-alpha.0] - 2020-02-21

## [0.3.0] - 2020-02-03

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
