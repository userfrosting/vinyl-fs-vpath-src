import pTest, { TestInterface } from "ava";
import path from "path";
import os from "os";
import fs from "fs";
import del from "del";
import { logAdapter } from "@userfrosting/ts-log-adapter-ava";
import resolver from "./resolver.js";

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

test("Returns all glob matched paths when no vpaths provided", t => {
    const file1 = t.context.pathAsAbsolute("test-data/scripts-1/a.js");
    const file2 = t.context.pathAsAbsolute("test-data/scripts-1/b.js");
    const file3 = t.context.pathAsAbsolute("test-data/scripts-2/a.js");
    const file4 = t.context.pathAsAbsolute("test-data/scripts-2/c.js");
    const file5 = t.context.pathAsAbsolute("test-data/scripts-3/b.js");
    const file6 = t.context.pathAsAbsolute("test-data/scripts-3/glob [syntax].js");

    t.deepEqual(
        resolver(
            [ t.context.pathAsRelative("test-data") + "/**/*.js" ],
            { virtPathMaps: [], cwd: process.cwd(), logger: logAdapter(t.log), }
        ),
        [
            { virtual: file1, actual: file1 },
            { virtual: file2, actual: file2 },
            { virtual: file3, actual: file3 },
            { virtual: file4, actual: file4 },
            { virtual: file5, actual: file5 },
            { virtual: file6, actual: file6 },
        ]
    );
});

test.only("Overrides when vpaths intersect", t => {
    const actual = resolver(
        [ t.context.pathAsRelative("test-data") + "/**/*.js" ],
        {
            virtPathMaps: [
                { match: t.context.pathAsAbsolute("test-data/scripts-3/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
                { match: t.context.pathAsAbsolute("test-data/scripts-1/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
                { match: t.context.pathAsAbsolute("test-data/scripts-2/"), replace: t.context.pathAsAbsolute("test-data/scripts/") },
            ],
            cwd: process.cwd(),
            logger: logAdapter(t.log),
        }
    );

    const expected = [
        { virtual: t.context.pathAsAbsolute("test-data/scripts/a.js"), actual: t.context.pathAsAbsolute("test-data/scripts-2/a.js") },
        { virtual: t.context.pathAsAbsolute("test-data/scripts/b.js"), actual: t.context.pathAsAbsolute("test-data/scripts-1/b.js") },
        { virtual: t.context.pathAsAbsolute("test-data/scripts/c.js"), actual: t.context.pathAsAbsolute("test-data/scripts-2/c.js") },
        { virtual: t.context.pathAsAbsolute("test-data/scripts/glob [syntax].js"), actual: t.context.pathAsAbsolute("test-data/scripts-3/glob [syntax].js") },
    ];

    t.deepEqual(actual, expected);
});
