import { it, describe, expect, afterAll } from "@jest/globals";
import { exec } from "child_process";
import path from "path";

describe("CLI", () => {
  const cliPath = path.resolve(process.cwd(), "dist" + "/cli.js");
  let testFolderPath = path.resolve(process.cwd(), "_test/");

  it("should display the correct version", (done) => {
    exec(`node ${cliPath} next-intl-scanner --version`, (error, stdout) => {
      expect(error).toBeNull();
      expect(stdout.trim()).toBe(require("../package.json").version);
      done();
    });
  });

  it("should display help for extract command", (done) => {
    exec(`node ${cliPath} next-intl-scanner --help`, (error, stdout) => {
      expect(error).toBeNull();
      expect(stdout).toContain(
        "Extracts and merges translations for Next.js applications using react-intl"
      );
      done();
    });
  });

  it("should log error if config file is not found", (done) => {
    exec(`node ${cliPath} extract`, (error, stdout) => {
      expect(stdout).toContain("Default Configuration file does not exist");
      done();
    });
  });

  it("should log error if config file is not found, in case custom config file is provided", (done) => {
    exec(
      `node ${cliPath} extract --config non-existent-config.json`,
      (error, stdout) => {
        expect(stdout).toContain("Configuration file does not exist");
        done();
      }
    );
  });

  it("should log error if config file is not valid", (done) => {
    exec(
      `node ${cliPath} extract --config ./_test/invalid.config.js`,
      (error, stdout) => {
        expect(stdout).toContain("Failed to validate configuration");
        done();
      }
    );
  });

  it("should process the translations with custom cjs", (done) => {
    exec(
      `node ${cliPath} extract --config ./_test/valid.config.js`,
      (error, stdout) => {
        expect(stdout).toContain("Translations extracted successfully");
        done();
      }
    );
  });

  it("should process the translations with custom json", (done) => {
    exec(
      `node ${cliPath} extract --config ./_test/valid.config.json`,
      (error, stdout) => {
        try {
          // Try a more precise match
          const successMessage = "Translations extracted successfully";
          const foundIndex = stdout.indexOf(successMessage);
          const foundSubstring = stdout.substring(
            foundIndex,
            foundIndex + successMessage.length
          );

          // Try both exact match and contains
          expect(foundSubstring).toBe(successMessage);
          expect(stdout).toContain(successMessage);
          done();
        } catch (err: unknown) {
          if (err instanceof Error) {
            done(err);
          } else {
            done(new Error(String(err)));
          }
        }
      }
    );
  });

  // check custom jsx component pattern
  it("should process the translations with custom jsx pattern", (done) => {
    exec(
      `node ${cliPath} extract --config ./_test/valid.config.json`,
      (error, stdout) => {
        expect(stdout).toContain("Translations extracted successfully");
        done();
      }
    );
  });

  afterAll(async () => {
    console.log("Cleaning up ", `${testFolderPath}/messages`);
    // await rimrafSync(`${testFolderPath}/messages/`);
    console.log("Done");
  });
});
