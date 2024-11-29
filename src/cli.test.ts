import { it, describe, expect, afterAll, jest } from "@jest/globals";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { rimraf } from "rimraf";

describe("CLI", () => {
  const cliPath = path.resolve(__dirname, "cli.ts");
  let testFolderPath = path.resolve(process.cwd(), "_test/");

  afterAll(async () => {
    console.log("done , cleaning up ", `${testFolderPath}/messages`);
    await rimraf(`${testFolderPath}/messages`);
  });

  it("should display the correct version", (done) => {
    exec(`tsx ${cliPath} next-intl-scanner --version`, (error, stdout) => {
      expect(error).toBeNull();
      expect(stdout.trim()).toBe(require("../package.json").version);
      done();
    });
  });

  it("should display help for extract command", (done) => {
    exec(`tsx ${cliPath} next-intl-scanner --help`, (error, stdout) => {
      expect(error).toBeNull();
      expect(stdout).toContain(
        "Extracts and merges translations for Next.js applications using react-intl"
      );
      done();
    });
  });

  it("should log error if config file is not found", (done) => {
    exec(`tsx ${cliPath} extract`, (error, stdout) => {
      expect(stdout).toContain("Default Configuration file does not exist");
      done();
    });
  });

  it("should log error if config file is not found, in case custom config file is provided", (done) => {
    exec(
      `tsx ${cliPath} extract --config non-existent-config.json`,
      (error, stdout) => {
        expect(stdout).toContain("Configuration file does not exist");
        done();
      }
    );
  });

  it("should log error if config file is not valid", (done) => {
    exec(
      `tsx ${cliPath} extract --config ./_test/invalid.config.js`,
      (error, stdout) => {
        expect(stdout).toContain("Failed to validate configuration");
        done();
      }
    );
  });

  it("should process the translations", (done) => {
    exec(
      `tsx ${cliPath} extract --config ./_test/valid.config.js`,
      (error, stdout) => {
        expect(stdout).toContain("Extracting translations...");

        done();
      }
    );
  });

  it("should have the correct translation files", (done) => {
    // open the file and check the content
    exec(`cat ~${testFolderPath}/messages/en.json`, async (error, stdout) => {
      const data = await fs.readFileSync(
        `${testFolderPath}/messages/en.json`,
        "utf-8"
      );
      const parsedData = JSON.parse(data);

      expect(parsedData.common["Hello Test!"]).toContain("Hello Test!");
      expect(parsedData.common["Ignore"]).toBeUndefined();
      done();
    });

    exec(`cat ~${testFolderPath}/messages/ar.json`, async (error, stdout) => {
      const data = await fs.readFileSync(
        `${testFolderPath}/messages/en.json`,
        "utf-8"
      );
      const parsedData = JSON.parse(data);

      expect(parsedData.common["Hello Test!"]).toContain("Hello Test!");
      expect(parsedData.common["Ignore"]).toBeUndefined();
      done();
    });
  });
});
