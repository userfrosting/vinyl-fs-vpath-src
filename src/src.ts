import { Readable } from "stream";
import resolver, { IVirtualPathMapping, IMappedPath } from "./resolver.js";
import { dummyLogger } from "ts-log";
import Vinyl from "vinyl";
import { readFileSync } from "fs";

class VinylFsVPathSrc extends Readable {

    /**
     * Resolved file path and its virtual path.
     */
    private readonly files: IMappedPath[];

    /**
     * @param blogs - Input file matchers.
     * @param vPathMap - Virtual path mappings.
     */
    constructor(globs: string|string[], vPathMap: IVirtualPathMapping[]) {
        super({ objectMode: true });

        globs = Array.isArray(globs) ? globs : [ globs ];
        this.files = resolver(globs, { vPathMap, logger: dummyLogger });

        // Ensure we have at least 1 file to read
        if (this.files.length < 1) {
            throw new Error("No files found");
        }
    }

    _read() {
        if (this.files.length > 0) {
            // Send through next file

            const { actual, virtual } = this.files.pop();

            const history: string[] = [];
            if (virtual !== actual) {
                history.push(actual);
            }

            this.push(new Vinyl({
                history,
                path: virtual,
                contents: readFileSync(actual),
            }));
        }
        else {
            this.push(null);
        }
    }
}

/**
 * Vinyl source which supports virtual paths with overrides on collision.
 * @param globs - Globs to discover files with.
 * @param vPathMap - Optional virtual path mappings to apply to discovered files.
 * Collision resolution uses the last mapping to select the file.
 *
 * @public
 */
export function src(globs: string|string[], vPathMap: IVirtualPathMapping[]): Readable {
    return new VinylFsVPathSrc(globs, vPathMap);
}
