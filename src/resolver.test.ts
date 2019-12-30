// AVA TS patch
declare global {
    export interface SymbolConstructor {
        readonly observable: symbol;
    }
}

import test, { LogFn } from "ava";
import resolver from "./resolver";
import { resolve as resolvePath } from "path";
import { Logger } from "ts-log";

function buildLogger(log: LogFn): Logger {
    return { debug: log, trace: log, info: log, error: log, warn: log };
}

test("Returns all glob matched paths when no vpaths provided", t => {
    const file1 = resolvePath("./test-data/scripts-1/a.js");
    const file2 = resolvePath("./test-data/scripts-1/b.js");
    const file3 = resolvePath("./test-data/scripts-2/a.js");
    const file4 = resolvePath("./test-data/scripts-2/c.js");
    const file5 = resolvePath("./test-data/scripts-3/b.js");

    t.deepEqual(
        resolver([ "./test-data/**/*.js" ], { vPathMap: [], logger: buildLogger(t.log) }),
        [
            [ file1, file1 ],
            [ file2, file2 ],
            [ file3, file3 ],
            [ file4, file4 ],
            [ file5, file5 ],
        ]
    );
});

test("Overrides when vpaths intersect", t => {
    t.deepEqual(
        resolver(
            [ "./test-data/**/*.js" ],
            {
                vPathMap: [
                    [ "./test-data/scripts-3/", "./test-data/scripts/" ],
                    [ "./test-data/scripts-1/", "./test-data/scripts/" ],
                    [ "./test-data/scripts-2/", "./test-data/scripts/" ],
                ],
                logger: buildLogger(t.log)
            }
        ),
        [
            [ resolvePath("./test-data/scripts/a.js"), resolvePath("./test-data/scripts-2/a.js") ],
            [ resolvePath("./test-data/scripts/b.js"), resolvePath("./test-data/scripts-1/b.js") ],
            [ resolvePath("./test-data/scripts/c.js"), resolvePath("./test-data/scripts-2/c.js") ],
        ]
    );
});
