declare module "glob-escape" {
    function escape(patterns: string[]): string[];
    function escape(pattern: string): string;

    export default escape;
}
