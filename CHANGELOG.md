# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Bumped dependency versions.

## [3.0.2] - 2021-07-10

### Changed
- Typos in logs.

## [3.0.1] - 2021-04-24

### Fixed
- File access errors not being pushed into stream, resulting in unclear failure reasons. [#285](https://github.com/userfrosting/vinyl-fs-vpath/issues/284)

## [3.0.0] - 2021-02-13

### Changed
- Removed `esm` loader in favour of native ESM support.
- Raised minimum NodeJS version from 10 to 12.17.0.

## [2.0.0] - 2020-10-25

[//]: # (spell-checker:disable)

### Changed
- `since` configuration option. Use [vinyl-filter-since](https://www.npmjs.com/package/vinyl-filter-since) if functionality is needed. This may be restored in a future release.
- `removeBOM` configuration option. Use [gulp-stripbom](https://www.npmjs.com/package/gulp-stripbom) if functionality is needed. This may be restored in a future release.
- `sourcemaps` configuration option. Use [gulp-sourcemaps](https://www.npmjs.com/package/gulp-sourcemaps) if functionality is needed. This may be restored in a future release.

[//]: # (spell-checker:enable)

### Fixed
* File names containing glob syntax failing to be read correctly due to unescaped glob syntax being processed by `vinyl-fs` internally. [#79](https://github.com/userfrosting/vinyl-fs-vpath/issues/79)

## [1.0.1] - 2020-06-20

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
- Customization of used current working directory.
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
