// AVA TS patch
declare global {
    export interface SymbolConstructor {
        readonly observable: symbol;
    }
}

import test, { LogFn } from "ava";
import { src } from "./src";
import { Logger } from "ts-log";
import getStream from "get-stream";

function buildLogger(log: LogFn): Logger {
    return { debug: log, trace: log, info: log, error: log, warn: log };
}

test("Throws if no files resolved", async t => {
    await t.throwsAsync(
        async () => await getStream.array(src("./test-data/scripts-0/**/*")),
        null,
        "No files found",
    );

    await t.throwsAsync(
        async () => await getStream.array(src("./test-data/scripts-1/0.js")),
        null,
        "No files found",
    );
});

test("Pushes expected files into stream", async t => {
    const data = await getStream.array(src("./test-data/**/*.js"));

    t.is(data.length, 5);
});

test("Pushes expected files into stream with vPaths and simple glob", async t => {
    const data = await getStream.array(src("./test-data/**/*.js", [
        [ "./test-data/scripts-3/", "./test-data/scripts/" ],
        [ "./test-data/scripts-1/", "./test-data/scripts/" ],
        [ "./test-data/scripts-2/", "./test-data/scripts/" ],
    ]));

    t.is(data.length, 3);
});

test("Pushes expected files into stream with vPaths and complex glob", async t => {
    const data = await getStream.array(src([ "./test-data/**/*.js" ], [
        [ "./test-data/scripts-3/", "./test-data/scripts/" ],
        [ "./test-data/scripts-1/", "./test-data/scripts/" ],
        [ "./test-data/scripts-2/", "./test-data/scripts/" ],
    ]));

    //t.log(data);

    t.is(data.length, 3);
});
