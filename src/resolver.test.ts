import test, { ExecutionContext } from "ava";
import path from "path";
import os from "os";
import fs from "fs";
import * as del from "del";
import { logAdapter } from "@userfrosting/ts-log-adapter-ava";
import resolver from "./resolver.js";

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

test("Returns all glob matched paths when no vpaths provided", t => {
    const { pathAsRelative, pathAsAbsolute, clean } = prep(t);

    const file1 = pathAsAbsolute("test-data/scripts-1/a.js");
    const file2 = pathAsAbsolute("test-data/scripts-1/b.js");
    const file3 = pathAsAbsolute("test-data/scripts-2/a.js");
    const file4 = pathAsAbsolute("test-data/scripts-2/c.js");
    const file5 = pathAsAbsolute("test-data/scripts-3/b.js");
    const file6 = pathAsAbsolute("test-data/scripts-3/glob [syntax].js");

    t.deepEqual(
        resolver(
            [ pathAsRelative("test-data") + "/**/*.js" ],
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

    clean();
});

test.only("Overrides when vpaths intersect", t => {
    const { pathAsRelative, pathAsAbsolute, clean } = prep(t);

    const actual = resolver(
        [ pathAsRelative("test-data") + "/**/*.js" ],
        {
            virtPathMaps: [
                { match: pathAsAbsolute("test-data/scripts-3/"), replace: pathAsAbsolute("test-data/scripts/") },
                { match: pathAsAbsolute("test-data/scripts-1/"), replace: pathAsAbsolute("test-data/scripts/") },
                { match: pathAsAbsolute("test-data/scripts-2/"), replace: pathAsAbsolute("test-data/scripts/") },
            ],
            cwd: process.cwd(),
            logger: logAdapter(t.log),
        }
    );

    const expected = [
        { virtual: pathAsAbsolute("test-data/scripts/a.js"), actual: pathAsAbsolute("test-data/scripts-2/a.js") },
        { virtual: pathAsAbsolute("test-data/scripts/b.js"), actual: pathAsAbsolute("test-data/scripts-1/b.js") },
        { virtual: pathAsAbsolute("test-data/scripts/c.js"), actual: pathAsAbsolute("test-data/scripts-2/c.js") },
        { virtual: pathAsAbsolute("test-data/scripts/glob [syntax].js"), actual: pathAsAbsolute("test-data/scripts-3/glob [syntax].js") },
    ];

    t.deepEqual(actual, expected);

    clean();
});
