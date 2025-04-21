import { it, describe, expect, jest, beforeEach } from "@jest/globals";
import fs from "fs";
import { exec } from "child_process";
import path from "path";

// Mock the Google Translate API before any tests run
jest.mock("@google-cloud/translate", () => ({
  Translate: jest.fn().mockImplementation(() => ({
    translate: jest
      .fn()
      .mockImplementation((text: unknown, options: unknown) => {
        const typedText = text as string;
        const typedOptions = options as { to: string };

        console.log("typedText", typedText);
        // For error test case
        if (typedText === "This should trigger an error") {
          throw new Error("Translation failed");
        }

        // For auto-translate test case
        if (typedOptions.to === "ar") {
          const translations: Record<string, string> = {
            "Hello Test!": "مرحبا بك في المسابقة",
            "Hello World!": "مرحبا بك في المسابقة",
            "Hello Namespace!": "مرحبا بك في المسابقة",
            "Insert text directly": "أدخل النص مباشرة",
            "Hello, {name}! You can use this tool to extract strings for {package}":
              "مرحبا {name}! يمكنك استخدام هذه الأداة لاستخراج السلاسل لـ {package}",
            "Test Message.": "مرحبا بك في المسابقة",
          };
          return Promise.resolve([translations[typedText] || typedText]);
        }

        // For preserve test case - return the same text
        return Promise.resolve([typedText]);
      }),
  })),
}));

describe("Translation Tests", () => {
  const cliPath = path.resolve(process.cwd(), "dist" + "/cli.js");
  let testFolderPath = path.resolve(process.cwd(), "_test/");

  beforeEach(() => {
    // Clean up test files before each test
    if (fs.existsSync(`${testFolderPath}/messages/ar.json`)) {
      fs.unlinkSync(`${testFolderPath}/messages/ar.json`);
    }
  });

  it("should auto-translate content when --auto-translate flag is set", (done) => {
    // Create a fresh test file
    const testTranslations = {
      "Hello Test!": "مرحبا بالعالم!",
      "Hello World!": "مرحبا بالعالم!",
    };
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(testTranslations, null, 2)
    );

    exec(
      `node ${cliPath} extract --config ./_test/valid.config.json --auto-translate`,
      (error, stdout) => {
        try {
          expect(stdout).toContain("Translations extracted successfully");
          expect(stdout).toContain("Auto-translating content for locale: ar");

          // Verify the translated content
          const arTranslations = JSON.parse(
            fs.readFileSync(`${testFolderPath}/messages/ar.json`, "utf-8")
          );

          // Check that content was translated
          expect(arTranslations["Hello Test!"]).toBe("مرحبا بالعالم!");
          expect(arTranslations["Hello World!"]).toBe("مرحبا بالعالم!");
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

  it("should preserve existing translations when auto-translating", (done) => {
    // Create a fresh test file with existing translations
    const existingTranslations = {
      customKey: "قيمة موجودة",
      "Hello Test!": "مرحبا بالعالم!",
    };
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(existingTranslations, null, 2)
    );

    exec(
      `node ${cliPath} extract --config ./_test/valid.config.json --auto-translate`,
      (error, stdout) => {
        try {
          expect(stdout).toContain("Translations extracted successfully");

          // Verify that existing translations were preserved
          const arTranslations = JSON.parse(
            fs.readFileSync(`${testFolderPath}/messages/ar.json`, "utf-8")
          );

          expect(arTranslations["customKey"]).toBe("قيمة موجودة");
          expect(arTranslations["Hello Test!"]).toBe("مرحبا بالعالم!");
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

  it("should handle translation errors gracefully", (done) => {
    // Create a fresh test file with a special key that will trigger the error
    const testTranslations = {
      ERROR_TEST: "This should trigger an error",
    };
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(testTranslations, null, 2)
    );

    exec(
      `node ${cliPath} extract --config ./_test/valid.config.json --auto-translate`,
      (error, stdout) => {
        try {
          expect(stdout).toContain(
            "Translation failed: Error: Translation failed"
          );
          expect(stdout).toContain("Translations extracted successfully");
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
});
