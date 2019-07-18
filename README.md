# [vinyl](https://github.com/gulpjs/vinyl)-fs-vpath

| Branch | Status |
| ------ | ------ |
| master | [![Build Status](https://travis-ci.org/userfrosting/vinyl-fs-vpaths-src.svg?branch=master)](https://travis-ci.org/userfrosting/vinyl-fs-vpaths) [![codecov](https://codecov.io/gh/userfrosting/vinyl-fs-vpaths/branch/master/graph/badge.svg)](https://codecov.io/gh/userfrosting/vinyl-fs-vpaths/branch/master) |
| develop | [![Build Status](https://travis-ci.org/userfrosting/vinyl-fs-vpaths.svg?branch=develop)](https://travis-ci.org/userfrosting/vinyl-fs-vpaths) [![codecov](https://codecov.io/gh/userfrosting/vinyl-fs-vpaths/branch/develop/graph/badge.svg)](https://codecov.io/gh/userfrosting/vinyl-fs-vpaths/branch/develop) |

Vinyl source for file system with support for virtual paths. Uses [globby](https://www.npmjs.com/package/globby) for file discovery.

## Install

```bash
npm i -D @userfrosting/vinyl-fs-vpath
```

## Usage

```js
// gulpfile.esm.js
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
        .pipe(uglify())
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

## API

Generation of API documentation is not yet implemented however the API surface is fully documented interally. Use VS Code or look at the source on GitHub in the meantime.

## Release process

Generally speaking, all releases should first traverse through `alpha`, `beta`, and `rc` (release candidate) to catch missed bugs and gather feedback as appropriate. Aside from this however, there are a few steps that **MUST** always be done.

1. Make sure [`CHANGELOG.md`](./CHANGELOG.md) is up to date.
2. Update version via `npm` like `npm version 3.0.0` or `npm version patch`.
3. `npm publish`.
4. Create release on GitHub from tag made by `npm version`.

## License

[MIT](LICENSE)
