/**
 * Extracts the name of a file without its extension.
 * e.g., "my-data-file.xlsx" becomes "my-data-file"
 * @param fileName The full name of the file.
 * @returns The name of the file without its extension.
 */
export const getFileNameWithoutExtension = (fileName: string): string => {
    return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
};

/**
 * Creates a "safe" version of a string to be used as a filename.
 * It replaces any non-alphanumeric characters with an underscore.
 * @param title The string to sanitize.
 * @param fallback A fallback name to use if the title is empty.
 * @returns A sanitized, safe string for use as a filename.
 */
export const createSafeFileName = (title: string, fallback: string = 'file'): string => {
    return title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || fallback;
};
