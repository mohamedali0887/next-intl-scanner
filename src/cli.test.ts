import { it, describe, expect, afterAll, jest } from "@jest/globals";
import fs from "fs";
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

  it("should have the correct translation files", (done) => {
    // open the file and check the content
    exec(`cat ~${testFolderPath}/messages/en.json`, async (error, stdout) => {
      const data = await fs.readFileSync(
        `${testFolderPath}/messages/en.json`,
        "utf-8"
      );
      const parsedData = JSON.parse(data);

      expect(parsedData["Hello Test!"]).toContain("Hello Test!");
      expect(parsedData.customNamespace["Hello Namespace!"]).toContain(
        "Hello Namespace!"
      );

      expect(parsedData.customHook["testKey"]).toContain("Test Message.");

      expect(parsedData["Ignore"]).toBeUndefined();
      done();
    });

    exec(`cat ~${testFolderPath}/messages/ar.json`, async (error, stdout) => {
      const data = await fs.readFileSync(
        `${testFolderPath}/messages/ar.json`,
        "utf-8"
      );
      const parsedData = JSON.parse(data);

      expect(parsedData["Hello Test!"]).toContain("Hello Test!");
      expect(parsedData["Insert text directly"]).toContain(
        "Insert text directly"
      );
      expect(
        parsedData[
          "Hello, {name}! You can use this tool to extract strings for {package}"
        ]
      ).toContain(
        "Hello, {name}! You can use this tool to extract strings for {package}"
      );

      expect(parsedData.customNamespace["Hello Namespace!"]).toContain(
        "Hello Namespace!"
      );

      expect(parsedData["Ignore"]).toBeUndefined();
      done();
    });
  });

  it("should process the translations with custom json", (done) => {
    exec(
      `node ${cliPath} extract --config ./_test/valid.config.json`,
      (error, stdout) => {
        expect(stdout).toContain("Translations extracted successfully");

        done();
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

  // //lets test the auto translate
  // it("should process the translations with auto translate", (done) => {
  //   exec(
  //     `node ${cliPath} extract --config ./_test/valid.config.json`,
  //     (error, stdout) => {
  //       expect(stdout).toContain("Translations extracted successfully");
  //     }
  //   );
  // });
  afterAll(async () => {
    console.log("Cleaning up ", `${testFolderPath}/messages`);
    // await rimrafSync(`${testFolderPath}/messages/`);
    console.log("Done");
  });
});
