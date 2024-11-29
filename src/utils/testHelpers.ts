import fs from "fs";

export const readFile = async (path: string): Promise<string> => {
  return fs.readFileSync(path, "utf-8");
};
