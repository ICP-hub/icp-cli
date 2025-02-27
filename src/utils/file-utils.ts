import logger from "./logger";

import fs from "fs";

export function readFile(path: string) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (err) {
    logger.error(`Could not read file at ${path}`);
    throw err;
  }
}
export function writeFile(path: string, content: string) {
  try {
    fs.writeFileSync(path, content);
    logger.info(`File written successfully at ${path}`);
  } catch (err) {
    logger.error(`Could not write file at ${path}`);
    throw err;
  }
}
