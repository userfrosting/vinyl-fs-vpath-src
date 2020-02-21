import test from "ava";
import { src } from "./src";
import getStream from "get-stream";
import { dummyLogger } from "ts-log";
import vinylFs from "vinyl-fs";
import sortOn from "sort-on";
import Vinyl from "vinyl";
import { resolve as resolvePath } from "path";

test("Throws if no files resolved", async t => {
    await t.throwsAsync(
        async () => await getStream.array<Vinyl>(src({
            globs: "./test-data/scripts-0/**/*",
            virtPathMaps: [],
            cwd: process.cwd(),
            logger: dummyLogger,
        })),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );

    await t.throwsAsync(
        async () => await getStream.array<Vinyl>(src({
            globs: "./test-data/scripts-1/0.js",
            virtPathMaps: [],
        })),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );
});

test("Pushes expected files into stream", async t => {
    const actual = sortOn(
        await getStream.array<Vinyl>(src({
            globs: "./test-data/**/*.js",
            virtPathMaps: [],
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({ path: resolvePath("./test-data/scripts-1/a.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-1/b.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-2/a.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-2/c.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-3/b.js") }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }
});

test("Pushes expected files into stream when custom options passed to Vinyl", async t => {
    // We are just pushing these custom options to Vinyl, so we aren't too concerned about their logic.
    const actual = sortOn(
        await getStream.array<Vinyl>(src({
            globs: "./test-data/**/*.js",
            virtPathMaps: [],
            base: process.cwd(),
            removeBOM: false,
            sourcemaps: true,
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({ path: resolvePath("./test-data/scripts-1/a.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-1/b.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-2/a.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-2/c.js") }),
            new Vinyl({ path: resolvePath("./test-data/scripts-3/b.js") }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }
});

test("Pushes expected files into stream with vPaths and simple glob", async t => {
    const actual = sortOn(
        await getStream.array<Vinyl>(src({
            globs: "./test-data/**/*.js",
            virtPathMaps: [
                { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
                { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
                { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
            ]
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({
                path: resolvePath("./test-data/scripts/b.js"),
                history: [ resolvePath("./test-data/scripts-1/b.js") ],
            }),
            new Vinyl({
                path: resolvePath("./test-data/scripts/a.js"),
                history: [ resolvePath("./test-data/scripts-2/a.js") ],
            }),
            new Vinyl({
                path: resolvePath("./test-data/scripts/c.js"),
                history: [ resolvePath("./test-data/scripts-2/c.js") ],
            }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }
});

test("Pushes expected files into stream with vPaths and complex glob", async t => {
    const actual = sortOn(
        await getStream.array<Vinyl>(src({
            globs: [ "./test-data/**/*.js", "!./test-data/scripts-2/**/*.js" ],
            virtPathMaps: [
                { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
                { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
                { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
            ]
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({
                path: resolvePath("./test-data/scripts/b.js"),
                history: [ resolvePath("./test-data/scripts-1/b.js") ],
            }),
            new Vinyl({
                path: resolvePath("./test-data/scripts/a.js"),
                history: [ resolvePath("./test-data/scripts-1/a.js") ],
            }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }
});

test("Outputs equivilant to vinyl-fs package", async t => {
    const actual = await getStream.array<Vinyl>(src({
        globs: [ "./test-data/**/*.js" ],
        virtPathMaps: [],
    }));

    const expected = await getStream.array<Vinyl>(vinylFs.src(
        "./test-data/**/*.js",
        { base: process.cwd() }
    ));

    // atime varies so we override to something more stable
    actual.forEach(file => {
        file.stat.atime = new Date();
        file.stat.atimeMs = 0;
    });
    expected.forEach(file => {
        file.stat.atime = new Date();
        file.stat.atimeMs = 0;
    });

    t.deepEqual(sortOn(actual, "history"), sortOn(expected, "history"));
});
