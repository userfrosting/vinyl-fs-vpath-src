import pTest, { TestInterface } from "ava";
import { src } from "./src.js";
import getStream from "get-stream";
import vinylFs from "vinyl-fs";
import sortOn from "sort-on";
import Vinyl from "vinyl";
import path from "path";
import { logAdapter } from "@userfrosting/ts-log-adapter-ava";
import os from "os";
import fs from "fs";
import del from "del";

// TODO Remove dependence on file system, this is currently an integration test retrofitted as a unit test
const test = pTest as TestInterface<{
    pathAsRelative: (naivePath: string) => string,
    pathAsAbsolute: (naivePath: string) => string,
}>;

test.before(t => {
    // Hooks for tests
    const mockCwd = (os.tmpdir() + "/vinyl-fs-vpath/src.test/").replace(/\\/g, "/");
    const mockCwdRelative = (path.relative(process.cwd(), mockCwd) + "/").replace(/\\/g, "/");
    function pathAsRelative(naivePath: string) {
        return mockCwdRelative + naivePath;
    }
    t.context.pathAsRelative = pathAsRelative;
    function pathAsAbsolute(naivePath: string) {
        return path.resolve(mockCwd + naivePath);
    }
    t.context.pathAsAbsolute = pathAsAbsolute;
    function writeFile(naivePath: string, data: string) {
        fs.writeFileSync(pathAsAbsolute(naivePath), data);
    }

    // Create files to be read
    fs.mkdirSync(pathAsAbsolute("test-data/scripts-1"), { recursive: true });
    writeFile("test-data/scripts-1/a.js", `window.a = "foo";`);
    writeFile("test-data/scripts-1/b.js", "function bar() {}");
    fs.mkdirSync(pathAsAbsolute("test-data/scripts-2"), { recursive: true });
    writeFile("test-data/scripts-2/a.js", "const add = (a, b) => a + b;");
    writeFile("test-data/scripts-2/c.js", `"use strict";\nalert("danger!");`);
    fs.mkdirSync(pathAsAbsolute("test-data/scripts-3"), { recursive: true });
    writeFile("test-data/scripts-3/b.js", `(function ($) {\n    $('body').foo();\n}(jQuery))`);
    writeFile("test-data/scripts-3/glob [syntax].js", `export function foo() {}`);
});

test.after(t => {
    del.sync(t.context.pathAsAbsolute("") + "/**");
});

test("Throws if no files resolved", async t => {
    await t.throwsAsync(
        async () => await getStream.array<Vinyl>(src({
            globs: t.context.pathAsRelative("test-data/scripts-0") + "/**/*",
            pathMappings: [],
            cwd: process.cwd(),
            logger: logAdapter(t.log),
        })),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );

    await t.throwsAsync(
        async () => await getStream.array<Vinyl>(src({
            globs: t.context.pathAsRelative("test-data/scripts-1/0.js"),
            pathMappings: [],
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
            globs: t.context.pathAsRelative("test-data") + "/**/*.js",
            pathMappings: [],
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-1/a.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-1/b.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-2/a.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-2/c.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-3/b.js") }),
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
            globs: t.context.pathAsRelative("test-data") + "/**/*.js",
            pathMappings: [],
            base: process.cwd(),
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-1/a.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-1/b.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-2/a.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-2/c.js") }),
            new Vinyl({ path: t.context.pathAsAbsolute("test-data/scripts-3/b.js") }),
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
            globs: t.context.pathAsRelative("test-data") + "/**/*.js",
            pathMappings: [
                { match: t.context.pathAsAbsolute("test-data/scripts-3/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
                { match: t.context.pathAsAbsolute("test-data/scripts-1/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
                { match: t.context.pathAsAbsolute("test-data/scripts-2/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
            ]
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({
                path: t.context.pathAsAbsolute("test-data/scripts/b.js"),
                history: [ t.context.pathAsAbsolute("test-data/scripts-1/b.js") ],
            }),
            new Vinyl({
                path: t.context.pathAsAbsolute("test-data/scripts/a.js"),
                history: [ t.context.pathAsAbsolute("test-data/scripts-2/a.js") ],
            }),
            new Vinyl({
                path: t.context.pathAsAbsolute("test-data/scripts/c.js"),
                history: [ t.context.pathAsAbsolute("test-data/scripts-2/c.js") ],
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
            globs: [
                t.context.pathAsRelative("test-data") + "/**/*.js",
                "!" + t.context.pathAsRelative("test-data/scripts-2") + "/**/*.js",
            ],
            pathMappings: [
                { match: t.context.pathAsAbsolute("test-data/scripts-3/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
                { match: t.context.pathAsAbsolute("test-data/scripts-1/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
                { match: t.context.pathAsAbsolute("test-data/scripts-2/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
            ]
        })),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({
                path: t.context.pathAsAbsolute("test-data/scripts/b.js"),
                history: [ t.context.pathAsAbsolute("test-data/scripts-1/b.js") ],
            }),
            new Vinyl({
                path: t.context.pathAsAbsolute("test-data/scripts/a.js"),
                history: [ t.context.pathAsAbsolute("test-data/scripts-1/a.js") ],
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

test("Outputs equivalent to vinyl-fs package", async t => {
    const actual = await getStream.array<Vinyl>(src({
        globs: [ t.context.pathAsRelative("test-data") + "/**/*.js" ],
        pathMappings: [],
        logger: logAdapter(t.log),
    }));

    const expected = await getStream.array<Vinyl>(vinylFs.src(
        t.context.pathAsRelative("test-data") + "/**/*.js",
        { base: process.cwd() }
    ));

    // atime varies so we override to something more stable
    const atime = new Date();
    actual.forEach(file => {
        file.stat.atime = atime;
        file.stat.atimeMs = atime.getMilliseconds();
    });
    expected.forEach(file => {
        file.stat.atime = atime;
        file.stat.atimeMs = atime.getMilliseconds();
    });

    t.deepEqual(sortOn(actual, "history"), sortOn(expected, "history"));
});
