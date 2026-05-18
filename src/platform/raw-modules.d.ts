/**
 * Vite's `?raw` import suffix: import a file's contents as a string. Redline
 * uses it to bundle the /redline command file into the extension, so the
 * extension can write the command into a user's project.
 */
declare module '*?raw' {
  const content: string;
  export default content;
}
