import test from "ava";
import { src } from "./src";
import getStream from "get-stream";

test("Throws if no files resolved", async t => {
    await t.throwsAsync(
        async () => await getStream.array(src("./test-data/scripts-0/**/*", [])),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );

    await t.throwsAsync(
        async () => await getStream.array(src("./test-data/scripts-1/0.js", [])),
        {
            instanceOf: Error,
            message: "No files found"
        }
    );
});

test("Pushes expected files into stream", async t => {
    const data = await getStream.array(src("./test-data/**/*.js", []));

    t.is(data.length, 5);
});

test("Pushes expected files into stream with vPaths and simple glob", async t => {
    const data = await getStream.array(src(
        "./test-data/**/*.js",
        [
            { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
        ]
    ));

    t.is(data.length, 3);
});

test("Pushes expected files into stream with vPaths and complex glob", async t => {
    const data = await getStream.array(src(
        [ "./test-data/**/*.js" ],
        [
            { match: "./test-data/scripts-3/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-1/", replace: "./test-data/scripts/" },
            { match: "./test-data/scripts-2/", replace: "./test-data/scripts/" },
        ]
    ));

    //t.log(data);

    t.is(data.length, 3);
});
