import { Logger } from "ts-log";
import { resolve as resolvePath } from "path";
import globby from "globby";

/**
 * @public
 */
export interface IVirtualPathMapping {
    /**
     * Path prefix to match (relative to cwd).
     */
    match: string;

    /**
     * Value to replace matched portion of path with.
     */
    replace: string;
}

/**
 * A file path mapping.
 */
export interface IMappedPath {
    /**
     * File's true path.
     */
    actual: string;

    /**
     * File's virtual path.
     */
    virtual: string;
}

interface IResolverOptions {
    /**
     * Virtual path mappings.
     */
    virtPathMaps: IVirtualPathMapping[];

    /**
     * Current working directory.
     */
    cwd: string;

    /**
     * Logger.
     */
    logger: Logger;
}

/**
 * Creates a list of file paths with overrides applied according to specified virtual path mappings.
 *
 * @param globs Glob patterns to locate files with.
 * @param options Additional options for file resolution.
 *
 * @returns Map of virtual paths to actual paths, all fully resolved to absolute paths.
 */
export default function (globs: string[], options: IResolverOptions): IMappedPath[] {
    const log = options.logger;
    const cwd = options.cwd;

    // Resolve all file paths

    log.trace("Looking for files", { globs: globs });

    const paths = new Set<string>(globby.sync(globs, { cwd }));

    log.trace(`Found ${paths.size} files, filtering with provided virtual paths`);

    /**
     * Used to track files resolved as per virtual paths.
     *
     * Key is virtual path.
     * Value tuple is;
     * - 1 is the real path
     * - 2 is the file perference
     */
    const candidatePaths = new Map<string, { actual: string, preference: number}>();

    for (const actual of paths) {
        log.trace("Inspecting file path", { path: actual });

        // Resolve path
        const [ virtual, preference ] = resolveVirtualPath(actual, options.virtPathMaps, cwd, log);

        // Add to resolved file if highest preference
        const existingFile = candidatePaths.get(virtual);
        if (existingFile) {
            if (existingFile.preference < preference) {
                log.trace("Superseeding existing file path", { virtual, actual, preference });
                candidatePaths.set(virtual, { actual, preference });
            }
            else {
                log.trace("Discarding new file path due to lower preference", { virtual, actual, preference });
            }
        }
        else {
            log.trace("Adding file path", { virtual, actual, preference });
            candidatePaths.set(virtual, { actual, preference });
        }
    }

    log.trace("Path filtering complete, cleaning up results to return", { paths: candidatePaths.size });

    // Simplify outputs

    const resolvedPaths: IMappedPath[] = [];

    for (const [ virtual, { actual } ] of candidatePaths.entries()) {
        resolvedPaths.push({ virtual, actual: resolvePath(cwd, actual) });
    }

    return resolvedPaths;
}

/**
 * Attempts to resolve path to a virtual path, returning provided path on failure.
 *
 * @param actual - Absolute path to try and resolve.
 * @param virtPathMaps - Virtual path mappings.
 * @param log - Logger
 *
 * @returns New or existing path and preference.
 */
function resolveVirtualPath(
    actual: string,
    virtPathMaps: IVirtualPathMapping[],
    cwd: string,
    log: Logger
): [string, number] {
    // Try to resolve a virtual path
    log.trace("Attempting to resolve virtual path", { path: actual });

    let preference = 0;
    for (const { match, replace } of virtPathMaps) {
        if (actual.startsWith(match)) {
            // Virtual path match discovered
            const virtual = resolvePath(cwd, actual.replace(match, replace));
            log.trace("Resolved virtual path", { actual, virtual, preference });
            return [ virtual, preference ];
        }

        preference++;
    }

    // No matches, lowest preference
    log.trace("No matching virtual path mappings", { actual, preference: 0 });
    return [ resolvePath(cwd, actual), 0] ;
}
