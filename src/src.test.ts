import test, { ExecutionContext } from "ava";
import { src } from "./src.js";
import vinylFs from "vinyl-fs";
import sortOn from "sort-on";
import Vinyl from "vinyl";
import path from "path";
import { logAdapter } from "@userfrosting/ts-log-adapter-ava";
import os from "os";
import fs from "fs";
import * as del from "del";
import PluginError from "plugin-error";
import stream from "stream";

// TODO Remove dependence on file system, this is currently an integration test retrofitted as a unit test
const testFileId = Buffer.from(import.meta.url).toString('base64');

function prep(t: ExecutionContext) {
    const testTitleId = Buffer.from(t.title, 'utf-8').toString('base64');
    const mockCwd = `${os.tmpdir()}/vinyl-fs-vpath/${testFileId}/${testTitleId}/`.replace(/\\/g, "/");
    const mockCwdRelative = (path.relative(process.cwd(), mockCwd) + "/").replace(/\\/g, "/");

    function pathAsRelative(naivePath: string) {
        return mockCwdRelative + naivePath;
    }

    function pathAsAbsolute(naivePath: string) {
        return path.resolve(mockCwd + naivePath);
    }

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

    return {
        pathAsAbsolute,
        pathAsRelative,
        clean() {
            del.deleteSync(pathAsAbsolute("") + "/**", { force: true });
        }
    }
}

test("Throws if no files resolved", async t => {
    const { pathAsRelative, clean } = prep(t);

    await t.throwsAsync(
        async () => await src({
            globs: pathAsRelative("test-data/scripts-0") + "/**/*",
            pathMappings: [],
            cwd: process.cwd(),
            logger: logAdapter(t.log),
        }).toArray(),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );

    await t.throwsAsync(
        async () => await src({
            globs: pathAsRelative("test-data/scripts-1/0.js"),
            pathMappings: [],
        }).toArray(),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );

    clean();
});

test("Pushes expected files into stream", async t => {
    const { pathAsRelative, pathAsAbsolute, clean } = prep(t);

    const actual = sortOn(
        await src({
            globs: pathAsRelative("test-data") + "/**/*.js",
            pathMappings: [],
        }).toArray(),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-1/a.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-1/b.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-2/a.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-2/c.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-3/b.js") }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }

    clean();
});

test("Pushes expected files into stream when custom options passed to Vinyl", async t => {
    const { pathAsRelative, pathAsAbsolute, clean } = prep(t);

    // We are just pushing these custom options to Vinyl, so we aren't too concerned about their logic.
    const actual = sortOn(
        await src({
            globs: pathAsRelative("test-data") + "/**/*.js",
            pathMappings: [],
            base: process.cwd(),
        }).toArray(),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-1/a.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-1/b.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-2/a.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-2/c.js") }),
            new Vinyl({ path: pathAsAbsolute("test-data/scripts-3/b.js") }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }

    clean();
});

test("Pushes expected files into stream with vPaths and simple glob", async t => {
    const { pathAsRelative, pathAsAbsolute, clean } = prep(t);

    const actual = sortOn(
        await src({
            globs: pathAsRelative("test-data") + "/**/*.js",
            pathMappings: [
                { match: pathAsAbsolute("test-data/scripts-3/"), replace: pathAsAbsolute("test-data/scripts/") },
                { match: pathAsAbsolute("test-data/scripts-1/"), replace: pathAsAbsolute("test-data/scripts/") },
                { match: pathAsAbsolute("test-data/scripts-2/"), replace: pathAsAbsolute("test-data/scripts/") },
            ]
        }).toArray(),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({
                path: pathAsAbsolute("test-data/scripts/b.js"),
                history: [ pathAsAbsolute("test-data/scripts-1/b.js") ],
            }),
            new Vinyl({
                path: pathAsAbsolute("test-data/scripts/a.js"),
                history: [ pathAsAbsolute("test-data/scripts-2/a.js") ],
            }),
            new Vinyl({
                path: pathAsAbsolute("test-data/scripts/c.js"),
                history: [ pathAsAbsolute("test-data/scripts-2/c.js") ],
            }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }

    clean();
});

test("Pushes expected files into stream with vPaths and complex glob", async t => {
    const { pathAsRelative, pathAsAbsolute, clean } = prep(t);

    const actual = sortOn(
        await src({
            globs: [
                pathAsRelative("test-data") + "/**/*.js",
                "!" + pathAsRelative("test-data/scripts-2") + "/**/*.js",
            ],
            pathMappings: [
                { match: pathAsAbsolute("test-data/scripts-3/"), replace: pathAsAbsolute("test-data/scripts/") },
                { match: pathAsAbsolute("test-data/scripts-1/"), replace: pathAsAbsolute("test-data/scripts/") },
                { match: pathAsAbsolute("test-data/scripts-2/"), replace: pathAsAbsolute("test-data/scripts/") },
            ]
        }).toArray(),
        "history"
    );

    const expected = sortOn(
        [
            new Vinyl({
                path: pathAsAbsolute("test-data/scripts/b.js"),
                history: [ pathAsAbsolute("test-data/scripts-1/b.js") ],
            }),
            new Vinyl({
                path: pathAsAbsolute("test-data/scripts/a.js"),
                history: [ pathAsAbsolute("test-data/scripts-1/a.js") ],
            }),
        ],
        "history"
    );

    for (let i = 0; i < expected.length; i++) {
        const expectedFile = expected[i];
        const actualFile = actual[i];
        t.deepEqual(actualFile.history, expectedFile.history);
    }

    clean();
});

// NOTE `vinyl-fs` will only resolve files under `cwd`, unlike our implementation.
//      This test differs from others as a result.
test("Outputs equivalent to vinyl-fs package", async t => {
    const { pathAsAbsolute, clean } = prep(t);

    const actual = await src({
        globs: [ "test-data/**/*.js" ],
        pathMappings: [],
        logger: logAdapter(t.log),
        base: pathAsAbsolute(""),
        cwd: pathAsAbsolute(""),
    }).toArray();

    // NOTE 'as' casting required due to NodeJS.ReadWriteStream being incompatible with import('stream').Stream
    // In practice they are usually identical.
    const helperStream = new stream.PassThrough({ objectMode: true });
    vinylFs.src(
        "test-data/**/*.js",
        { base: pathAsAbsolute(""), cwd: pathAsAbsolute("") }
    ).pipe(helperStream);
    const expected = await helperStream.toArray();

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

    clean();
});

test("Reports file access errors", async t => {
    const { pathAsRelative, clean } = prep(t);

    // Have files discovered
    const readable = src({
        globs: [ pathAsRelative("test-data") + "/**/*.js" ],
        pathMappings: [],
        logger: logAdapter(t.log),
    });

    // Delete them
    await del.deleteAsync(pathAsRelative("test-data/scripts-1/a.js"), { force: true });

    // And watch the resulting fire when we try to read
    await t.throwsAsync(
        () => readable.toArray(),
        { instanceOf: PluginError, any: true },
    );

    clean();
});
