declare module "vinyl-file" {
    import File from "vinyl";

    export interface VinylFileOptions {
        /** Specifies the working directory the folder is relative to */
        cwd?: string | undefined;

        /** Specifies the folder relative to the cwd */
        base?: string | undefined;

        /** Setting this to false will retuurn file.contents as a stream */
        buffer?: boolean | undefined;

        /** Setting this to false will return file.contents as null and not read the file at all */
        read?: boolean | undefined;
    }

    export function vinylFileSync(path: string, options?: VinylFileOptions): File;

    export function vinylFile(path: string, options?: VinylFileOptions): Promise<File>;
}
