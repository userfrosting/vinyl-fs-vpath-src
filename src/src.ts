import { Readable } from "stream";
import resolver, { IVirtPathMapping, IMappedPath } from "./resolver.js";
import { dummyLogger, Logger } from "ts-log";
import Vinyl from "vinyl";
import getStream from "get-stream";
import vinylFs from "vinyl-fs";

/**
 * @public
 */
export interface IConfig {
    /**
     * Input file matchers.
     */
    globs: string|string[];

    /**
     * Virtual path mappings. Collision resolution uses the last mapping to select the file.
     * Internally mapping occurs on absolute path strings, conversion and normalisation is
     * performed automatically. Resolution is *not* recursive.
     */
    virtPathMaps: IVirtPathMapping[];

    /**
     * Current working directory.
     * Default: process.cwd()
     */
    cwd?: string;

    /**
     * Optional logger. Use this to debug issues and trace behaviours.
     * Adheres to interface defined in ts-log package.
     */
    logger?: Logger;

    /**
     * Specifies the folder relative to the cwd
     * This is used to determine the file names when saving in .dest()
     * Default: cwd
     */
    base?: string;

    /**
     * Only find files that have been modified since the time specified
     */
    since?: Date | number;

    /**
     * Causes the BOM to be removed on UTF-8 encoded files. Set to false if you need the BOM for some reason.
     * Default: true
     */
    removeBOM?: boolean;

    /**
     * Setting this to true will enable sourcemaps.
     * Default: false
     */
    sourcemaps?: boolean;
}

class VinylFsVPathSrc extends Readable {

    /**
     * Resolved file path and its virtual path.
     */
    private readonly files: IMappedPath[];

    private readonly logger: Logger;

    private readonly vinylFsSrcOptions: vinylFs.SrcOptions;

    /**
     * @param config - Source configuration.
     */
    constructor(config: IConfig) {
        super({ objectMode: true });

        const globs = Array.isArray(config.globs) ? config.globs : [ config.globs ];
        const cwd = config.cwd ?? process.cwd();
        // Mappings are map absolute within resolver
        const virtPathMaps = config.virtPathMaps;

        // Logger
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

        // Vinyl FS src options
        this.vinylFsSrcOptions = {
            cwd: cwd,
            base: config.base ?? cwd,
            since: config.since,
            allowEmpty: Boolean(config.since),
            removeBOM: config.removeBOM ?? true,
            sourcemaps: config.sourcemaps ?? false,
        };
    }

    /**
     * Internal only. Instructs that a new file needs to be pushed out.
     */
    async _read() {
        while (this.files.length > 0) {
            const { actual, virtual } = this.files.pop();

            // Grab file via vinyl-fs
            const files = await getStream.array<Vinyl>(vinylFs.src(actual, this.vinylFsSrcOptions));

            // Handle 'since' filter
            if (files.length === 0 && this.vinylFsSrcOptions.allowEmpty) {
                // Missing file allowed
                this.logger.trace(
                    "File ignored as filtered by 'since' option",
                    { actual, virtual, since: this.vinylFsSrcOptions.since }
                );
                // Onto next iteration for the next file
                continue;
            }

            // Adjust path
            const file = files[0];

            if (actual !== virtual) {
                file.path = virtual;
            }

            this.logger.trace("Pushing file", { actual, virtual });
            this.push(file);
            return;
        }

        this.logger.trace("No more files to send");
        this.push(null);
        return;
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
