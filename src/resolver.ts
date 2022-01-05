import { Logger } from "ts-log";
import { globbySync } from "globby";
import { resolve as resolvePath } from "path";

/**
 * @public
 */
export interface IPathMapper {
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
    virtPathMaps: IPathMapper[];

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
    const virtPathMaps = options.virtPathMaps;

    // Make mappings absolute
    for (const virtPathMap of virtPathMaps) {
        virtPathMap.match = resolvePath(virtPathMap.match);
        virtPathMap.replace = resolvePath(virtPathMap.replace);
    }

    // Resolve all file paths

    log.trace("Looking for files", { globs });

    const paths = globbySync(globs, { cwd, onlyFiles: true, unique: true })
        .map(path => resolvePath(cwd, path));

    log.trace(`Found ${paths.length} files, filtering with provided virtual paths`);

    // Used to track files resolved as per virtual paths. Key is virtual path.
    const candidatePaths = new Map<string, { actual: string, preference: number}>();

    for (const actual of paths) {
        log.trace("Inspecting file path", { actual });

        // Resolve path
        const [ virtual, preference ] = resolveVirtualPath(actual, options.virtPathMaps, log);

        // Add to resolved file if highest preference
        const existingFile = candidatePaths.get(virtual);
        if (existingFile) {
            if (existingFile.preference < preference) {
                log.trace("Super-seeding existing file path", { virtual, actual, preference });
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

    log.trace("Path filtering complete, cleaning up results to return", { candidatePaths: candidatePaths.size });

    // Clean outputs

    const resolvedPaths: IMappedPath[] = [];

    for (const [ virtual, { actual } ] of candidatePaths.entries()) {
        resolvedPaths.push({ virtual, actual });
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
    virtPathMaps: IPathMapper[],
    log: Logger
): [string, number] {
    // Try to resolve a virtual path
    log.trace("Attempting to resolve virtual path", { actual });

    let preference = 0;
    for (const { match, replace } of virtPathMaps) {
        if (actual.startsWith(match)) {
            // Virtual path match discovered
            const virtual = actual.replace(match, replace);
            log.trace("Resolved virtual path", { actual, virtual, preference });
            return [ virtual, preference ];
        }

        preference++;
    }

    // No matches, lowest preference
    log.trace("No matching virtual path mappings", { actual, preference: 0 });
    return [ actual, 0] ;
}
