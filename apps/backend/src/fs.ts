import path from 'node:path';

/**
 * Reads a text file and returns its contents as a string
 * @param filePath - Path to the text file
 * @returns The file contents as a string
 * @throws If the file does not exist or is not a text file
 */
export async function readTextFile(filePath: string): Promise<string> {
  const resolvedFilePath = resolvePath(filePath);

  const file = Bun.file(resolvedFilePath);

  // Ensure the file exists
  if (!(await file.exists())) {
    throw new Error(`File not found: ${resolvedFilePath}`);
  }

  return await file.text();
}

function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), filePath);
}
