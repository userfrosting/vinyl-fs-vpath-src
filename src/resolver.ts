import { Logger } from "ts-log";
import { resolve as resolvePath } from "path";
import globby from "globby";

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

export interface IMappedPath {
    actual: string;
    virtual: string;
}

interface IResolverOptions {
    vPathMap: IVirtualPathMapping[];
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

    // Resolve all file paths

    log.trace("Looking for files", { globs: globs });

    const paths = new Set<string>(globby.sync(globs));

    log.trace(`Found ${paths.size} files, filtering with provided virtual paths`);

    /**
     * Used to track files resolved as per virtual paths.
     *
     * Key is virtual path.
     * Value tuple is;
     * - 1 is the real path
     * - 2 is the file perference
     */
    const candidatePaths = new Map<string, [string, number]>();

    for (const path of paths) {
        log.trace("Inspecting file path", { path });

        // Resolve path
        const [ vPath, preference ] = resolveVirtualPath(path, options.vPathMap, log);

        // Add to resolved file if highest preference
        const existingFile = candidatePaths.get(vPath);
        if (existingFile) {
            if (existingFile[1] < preference) {
                log.trace("Superseeding existing file path", { vPath, path, preference });
                candidatePaths.set(vPath, [ path, preference ]);
            }
            else {
                log.trace("Discarding new file path due to lower preference", { vPath, path, preference });
            }
        }
        else {
            log.trace("Adding file path", { vPath, path, preference });
            candidatePaths.set(vPath, [ path, preference ]);
        }
    }

    log.trace("Path filtering complete, cleaning up results to return", { paths: candidatePaths.size });

    // Simplify outputs

    const resolvedPaths: IMappedPath[] = [];

    for (const [ vPath, [ path ] ] of candidatePaths.entries()) {
        resolvedPaths.push({ virtual: resolvePath(vPath), actual: resolvePath(path) });
    }

    return resolvedPaths;
}

/**
 * Attempts to resolve path to a virtual path, returning provided path on failure.
 *
 * @param path - Absolute path to try and resolve.
 * @param vPaths - Virtual path mappings.
 * @param log - Logger
 *
 * @returns New or existing path and preference.
 */
function resolveVirtualPath(path: string, vPaths: IVirtualPathMapping[], log: Logger): [string, number] {
    // Try to resolve a virtual path
    log.trace("Attempting to resolve virtual path", { path });

    let preference = 0;
    for (const { match, replace } of vPaths) {
        if (path.startsWith(match)) {
            // Virtual path match discovered
            const resolvedPath = resolvePath(path.replace(match, replace));
            log.trace("Resolved virtual path", { path, resolvedPath, preference });
            return [ resolvedPath, preference ];
        }

        preference++;
    }

    // No matches, lowest preference
    log.trace("No matching virtual path mappings", { path, preference: 0 });
    return [ path, 0] ;
}
