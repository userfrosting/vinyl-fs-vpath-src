import { Readable } from "stream";
import resolver, { IVirtualPathMapping, IMappedPath } from "./resolver.js";
import { dummyLogger, Logger } from "ts-log";
import Vinyl from "vinyl";
import { readFileSync } from "fs";

interface IConfig {
    /**
     * Input file matchers.
     */
    globs: string|string[];

    /**
     * Virtual path mappings.
     * Collision resolution uses the last mapping to select the file.
     * Resolution is *not* recursive.
     */
    virtPathMaps: IVirtualPathMapping[];

    /**
     * Current working directory.
     * NodeJS cwd is used if not supplied.
     */
    cwd?: string;

    /**
     * Optional logger.
     */
    logger?: Logger;
}

class VinylFsVPathSrc extends Readable {

    /**
     * Resolved file path and its virtual path.
     */
    private readonly files: IMappedPath[];

    private readonly logger: Logger;

    /**
     * @param config - Source configuration.
     */
    constructor(config: IConfig) {
        super({ objectMode: true });

        const globs = Array.isArray(config.globs) ? config.globs : [ config.globs ];
        const virtPathMaps = config.virtPathMaps;
        const cwd = config.cwd ?? process.cwd();
        this.logger = config.logger ?? dummyLogger;

        this.files = resolver(
            globs,
            { virtPathMaps, cwd, logger: this.logger }
        );

        // Ensure we have at least 1 file to read
        if (this.files.length < 1) {
            this.logger.error("No files found", { globs, virtPathMaps });
            throw new Error("No files found");
        }
    }

    _read() {
        if (this.files.length > 0) {
            // Send through next file

            const { actual, virtual } = this.files.pop();
            this.logger.trace("Pushing file", { actual, virtual });

            const history: string[] = [];
            if (virtual !== actual) {
                history.push(actual);
            }

            this.push(new Vinyl({
                history,
                path: virtual,
                contents: readFileSync(actual),
            }));
            this.logger.trace("Pushed file", { actual, virtual });
        }
        else {
            this.logger.trace("No more files to send, ending stream");
            this.push(null);
        }
    }
}

/**
 * Vinyl source that maps input files with virtual paths.
 * Files are overriden on collision.
 * @param config - Source configuration.
 *
 * @public
 */
export function src(config: IConfig): Readable {
    return new VinylFsVPathSrc(config);
}
