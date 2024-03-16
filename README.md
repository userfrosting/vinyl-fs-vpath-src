# @userfrosting/[vinyl](https://github.com/gulpjs/vinyl)-fs-vpath

| Branch | Status |
| ------ | ------ |
| master | [![Continuous Integration](https://github.com/userfrosting/vinyl-fs-vpath/workflows/Continuous%20Integration/badge.svg?branch=master)](https://github.com/userfrosting/vinyl-fs-vpath/actions?query=branch:master+workflow:"Continuous+Integration") [![codecov](https://codecov.io/gh/userfrosting/vinyl-fs-vpath/branch/master/graph/badge.svg)](https://codecov.io/gh/userfrosting/vinyl-fs-vpath/branch/master) |

Vinyl source for file system with support for virtual paths. Uses [globby](https://www.npmjs.com/package/globby) for file discovery.

## Install

```bash
npm i -D @userfrosting/vinyl-fs-vpath
```

## Usage

```js
// gulpfile.mjs
import { src } from "@userfrosting/vinyl-fs-vpath";
import { dest } from "gulp";
import terser from "gulp-terser";
import concatJs from "gulp-concat-js";

export function bundle() {
    return src(
            [ "src/**/*.js", "!src/**/*/*.test.js" ],
            [
                [ "./src/layer-1/", "./src/" ],
                [ "./src/layer-2/", "./src/" ]
            ]
        )
        .pipe(concatJs("main.js"))
        .pipe(terser())
        .pipe(dest("public/assets/"));
}
```

```bash
$ gulp bundle
```

```
./
+ src/
| + special.test.js
| + README.md
| + layer-1/
| | + a.js
| | + b.js
| + layer-2/
|   + a.js
|   + c.js
|   + c.test.js
+ public/assets/
  + a.js (from src/layer-2)
  + b.js (from src/layer-1)
  + c.js (from src/layer-2)
```

## Why no `dest`?

Applying virtual path logic requires knowledge, without it there is no way to perform the operation in a deterministic manner. `src` does this by finding all the files and then performing the virtual path logic against the complete set, such an approach however does map translate to `dest` well. Memory pressure is a significant concern (that has no easy workaround) and perhaps more importantly it hurts the efficiency of the overall pipeline by introducing back-pressure (tasks later in the pipeline remain idle, reducing opportunity for asynchronous operations to be run).

I can see a need for mid-stream or end-of-stream virtual path operations in more specialized scenarios, so if its needed file an issue. Much of the logic already exists in `@userfrosting/gulp-bundle-assets@^3`, so it would not be a significant undertaking. The scope would most likely be limited to mid-stream operations to avoid duplicating the functionality of `gulp.dest` which can just be chained immediately after.

## API

API documentation is regenerated for every release using [API Extractor](https://www.npmjs.com/package/@microsoft/api-extractor) and [API Documenter](https://www.npmjs.com/package/@microsoft/api-documenter).
The results reside in [docs/api](./docs/api/index.md).

## Release process

Generally speaking, all releases should first traverse through `alpha`, `beta`, and `rc` (release candidate) to catch missed bugs and gather feedback as appropriate. Aside from this however, there are a few steps that **MUST** always be done.

1. Make sure [`CHANGELOG.md`](./CHANGELOG.md) is up to date.
2. Update version via `npm` like `npm version 3.0.0` or `npm version patch`.
3. `npm publish`.
4. Create release on GitHub from tag made by `npm version`.

## License

[MIT](LICENSE)
