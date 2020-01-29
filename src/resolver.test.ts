import test, { LogFn } from "ava";
import resolver from "./resolver";
import { resolve as resolvePath } from "path";
import { dummyLogger } from "ts-log";

test("Returns all glob matched paths when no vpaths provided", t => {
    const file1 = resolvePath("./test-data/scripts-1/a.js");
    const file2 = resolvePath("./test-data/scripts-1/b.js");
    const file3 = resolvePath("./test-data/scripts-2/a.js");
    const file4 = resolvePath("./test-data/scripts-2/c.js");
    const file5 = resolvePath("./test-data/scripts-3/b.js");

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
    ];

    t.deepEqual(actual, expected);
});
