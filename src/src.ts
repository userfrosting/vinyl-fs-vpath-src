import { Readable } from "stream";
import resolver, { IPathMapper, IMappedPath } from "./resolver.js";
import { dummyLogger, Logger } from "ts-log";
import vinylFile, { VinylFileOptions } from "vinyl-file";
import PluginError from "plugin-error";

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
    pathMappings: IPathMapper[];

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
}

class VinylFsVPathSrc extends Readable {

    /**
     * Resolved file path and its virtual path.
     */
    private readonly files: IMappedPath[];

    private readonly logger: Logger;

    private readonly vinylFsSrcOptions: VinylFileOptions;

    /**
     * @param config - Source configuration.
     */
    constructor(config: IConfig) {
        super({ objectMode: true });

        const globs = Array.isArray(config.globs) ? config.globs : [ config.globs ];
        const cwd = config.cwd ?? process.cwd();
        // Mappings are map absolute within resolver
        const virtPathMaps = config.pathMappings;

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
        };
    }

    /**
     * Internal only. Instructs that a new file needs to be pushed out.
     */
    async _read() {
        while (this.files.length > 0) {
            const { actual, virtual } = this.files.pop();

            try {
                const file = vinylFile.readSync(actual, this.vinylFsSrcOptions);

                if (actual !== virtual) {
                    file.path = virtual;
                }

                this.logger.trace("Pushing file", { actual, virtual });
                this.push(file);
                return;
            } catch (error) {
                // This can happen when there are file changes during processing, difficult to test
                /* istanbul ignore next */
                throw new PluginError("userfrosting/vinyl-fs-vpath", error);
            }
        }

        this.logger.trace("No more files to send");
        this.push(null);
        return;
    }
}

/**
 * Vinyl source that maps input files with virtual paths.
 * Files are overridden on collision.
 * @param config - Source configuration.
 *
 * @public
 */
export function src(config: IConfig): Readable {
    return new VinylFsVPathSrc(config);
}
