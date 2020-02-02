import test from "ava";
import { src } from "./src";
import getStream from "get-stream";
import { dummyLogger } from "ts-log";
import vinylFs from "vinyl-fs";
import sortOn from "sort-on";
import Vinyl from "vinyl";

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
    const data = await getStream.array<Vinyl>(src({
        globs: "./test-data/**/*.js",
        virtPathMaps: [],
    }));

    t.is(data.length, 5);
});

test("Pushes expected files into stream with vPaths and simple glob", async t => {
    const data = await getStream.array<Vinyl>(src({
        globs: "./test-data/**/*.js",
        virtPathMaps: [
            { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
        ]
    }));

    t.is(data.length, 3);
});

test("Pushes expected files into stream with vPaths and complex glob", async t => {
    const data = await getStream.array<Vinyl>(src({
        globs: [ "./test-data/**/*.js" ],
        virtPathMaps: [
            { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
        ]
    }));

    t.is(data.length, 3);
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
