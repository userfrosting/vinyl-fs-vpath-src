import test from "ava";
import { resolve as resolvePath } from "path";
import mockFs from "mock-fs";
import { dummyLogger } from "ts-log";
import resolver from "./resolver.js";

test.before(t => {
    mockFs({
        "./test-data": {
            "scripts-1": {
                "a.js": `window.a = "foo";`,
                "b.js": "function bar() {}",
            },
            "scripts-2": {
                "a.js": "const add = (a, b) => a + b;",
                "c.js": `"use strict";\nalert("danger!");`,
            },
            "scripts-3": {
                "b.js": `(function ($) {\n    $('body').foo();\n}(jQuery))`,
                "glob [syntax].js": `export function foo() {}`,
            },
        }
    });
});

test.after(t => {
    mockFs.restore();
});

test("Returns all glob matched paths when no vpaths provided", t => {
    const file1 = resolvePath("./test-data/scripts-1/a.js");
    const file2 = resolvePath("./test-data/scripts-1/b.js");
    const file3 = resolvePath("./test-data/scripts-2/a.js");
    const file4 = resolvePath("./test-data/scripts-2/c.js");
    const file5 = resolvePath("./test-data/scripts-3/b.js");
    const file6 = resolvePath("./test-data/scripts-3/glob [syntax].js");

    t.deepEqual(
        resolver(
            [ "./test-data/**/*.js" ],
            { virtPathMaps: [], cwd: process.cwd(), logger: dummyLogger }
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
        [ "./test-data/**/*.js" ],
        {
            virtPathMaps: [
                { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
                { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
                { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
            ],
            cwd: process.cwd(),
            logger: dummyLogger
        }
    );

    const expected = [
        { virtual: resolvePath("./test-data/scripts/a.js"), actual: resolvePath("./test-data/scripts-2/a.js") },
        { virtual: resolvePath("./test-data/scripts/b.js"), actual: resolvePath("./test-data/scripts-1/b.js") },
        { virtual: resolvePath("./test-data/scripts/c.js"), actual: resolvePath("./test-data/scripts-2/c.js") },
        { virtual: resolvePath("./test-data/scripts/glob [syntax].js"), actual: resolvePath("./test-data/scripts-3/glob [syntax].js") },
    ];

    t.deepEqual(actual, expected);
});
