import { Readable } from "stream";
import resolver from "./resolver";
import { dummyLogger } from "ts-log";
import Vinyl from "vinyl";
import { readFileSync } from "fs";

export default class extends Readable {

    private readonly files: [ string, string ][];

    /**
     *
     * @param inputs
     * @param virtualPathMappings
     */
    constructor(globs: string|string[], vPathMap?: [string, string][]) {
        super({ objectMode: true });

        globs = Array.isArray(globs) ? globs : [ globs ];
        this.files = resolver(globs, { vPathMap: vPathMap || [], logger: dummyLogger });

        // Ensure we have at least 1 file to read
        if (this.files.length < 1) {
            throw new Error("No files found");
        }
    }

    _read() {
        if (this.files.length > 0) {
            // Send through next file

            const [ vPath, realPath ] = this.files.pop();

            const history: string[] = [];
            if (vPath !== realPath) {
                history.push(realPath);
            }

            this.push(new Vinyl({
                history,
                path: vPath,
                contents: readFileSync(realPath),
            }));
        }
        else {
            this.push(null);
        }
    }
}
