import { it, describe, expect, jest, beforeEach } from "@jest/globals";
import fs from "fs";
import path from "path";
import { runCli } from "./cli-runner";

// Mock the Google Translate API before any imports that use it
jest.mock("@google-cloud/translate", () => ({
  v2: {
    Translate: jest.fn().mockImplementation(() => ({
      translate: jest.fn().mockImplementation((text: unknown, options: any) => {
        const typedText = text as string;
        const typedOptions = options as { to: string };

        if (typedOptions.to === "ar") {
          const translations: Record<string, string> = {
            "Hello Test!": "مرحبا بالعالم!",
            "Hello World!": "مرحبا بالعالم!",
            "Insert text directly": "أدخل النص مباشرة",
            "Hello, {name}! You can use this tool to extract strings for {package}":
              "مرحبا {name}! يمكنك استخدام هذه الأداة لاستخراج السلاسل لـ {package}",
            "Test Message.": "مرحبا بك في المسابقة",
          };
          return Promise.resolve([translations[typedText] || typedText]);
        }

        return Promise.resolve([typedText]);
      }),
    })),
  },
}));

describe("Translation Tests", () => {
  const testFolderPath = path.resolve(process.cwd(), "_test");

  beforeEach(() => {
    const messagesDir = `${testFolderPath}/messages`;
    // Create messages directory if it doesn't exist
    if (!fs.existsSync(messagesDir)) {
      fs.mkdirSync(messagesDir, { recursive: true });
    }

    const arFile = `${messagesDir}/ar.json`;
    if (fs.existsSync(arFile)) {
      fs.unlinkSync(arFile);
    }
  });

  it("should auto-translate content when --auto-translate flag is set", async () => {
    const testTranslations = {
      "Hello Test!": "مرحبا بالعالم!",
      "Hello World!": "مرحبا بالعالم!",
    };
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(testTranslations, null, 2)
    );
    console.log("testTranslations", testTranslations);

    //lets set a fake  API KEY
    process.env.GOOGLE_TRANSLATE_API_KEY = "fake-api-key";
    await runCli([
      "extract",
      "--config",
      "./_test/valid.config.json",
      "--auto-translate",
    ]);

    const arTranslations = JSON.parse(
      fs.readFileSync(`${testFolderPath}/messages/ar.json`, "utf-8")
    );

    console.log("arTranslations after", arTranslations);

    expect(arTranslations["Hello Test!"]).toBe("مرحبا بالعالم!");
    expect(arTranslations["Hello World!"]).toBe("مرحبا بالعالم!");
  });

  it("should preserve existing translations when auto-translating", async () => {
    const existingTranslations = {
      customKey: "قيمة موجودة",
      "Hello Test!": "مرحبا بالاختبار!",
    };
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(existingTranslations, null, 2)
    );

    console.log("existingTranslations before ", existingTranslations);

    await runCli([
      "extract",
      "--config",
      "./_test/valid.config.json",
      "--auto-translate",
    ]);

    const arTranslations = JSON.parse(
      fs.readFileSync(`${testFolderPath}/messages/ar.json`, "utf-8")
    );
    console.log("arTranslations after ", arTranslations);

    expect(arTranslations["customKey"]).toBe("قيمة موجودة");
    expect(arTranslations["Hello Test!"]).toBe("مرحبا بالاختبار!");
  });

  it("should remove unused translation keys when --clean flag is set", async () => {
    // Create translation files with some unused keys
    const translationsWithUnusedKeys = {
      "jsxNamespace": {
        "formattedMessageKey": "formatted string with a dot"
      },
      "common": {
        "select-status": "select-status",
        "all": "all",
        "unused-key": "This key is not used anywhere"
      },
      "validation": {
        "required-field": "required-field"
      },
      "title": "title",
      "description": "description",
      "helloNamespace": "Hello Namespace!",
      "testServerString": "testServerString",
      "Hello Test!": "Hello Test!",
      "Hello World!": "Hello World!",
      "Insert text directly": "Insert text directly",
      "Hello, {name}! You can use this tool to extract strings for {package}": "Hello, {name}! You can use this tool to extract strings for {package}",
      "anErrorOccurredDuringAuthenticationPleaseTryAgainLaterOrContactSupport": "anErrorOccurredDuringAuthenticationPleaseTryAgainLaterOrContactSupport",
      "testKey": "testKey",
      "unused-global-key": "This global key is not used anywhere"
    };

    // Write the same content to both en.json and ar.json
    fs.writeFileSync(
      `${testFolderPath}/messages/en.json`,
      JSON.stringify(translationsWithUnusedKeys, null, 2)
    );
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(translationsWithUnusedKeys, null, 2)
    );

    console.log("Translations before cleaning:", translationsWithUnusedKeys);

    // Run extraction with --clean flag
    await runCli([
      "extract",
      "--config",
      "./_test/valid.config.json",
      "--clean",
    ]);

    // Check that unused keys were removed from both files
    const enTranslations = JSON.parse(
      fs.readFileSync(`${testFolderPath}/messages/en.json`, "utf-8")
    );
    const arTranslations = JSON.parse(
      fs.readFileSync(`${testFolderPath}/messages/ar.json`, "utf-8")
    );

    console.log("Translations after cleaning:", enTranslations);

    // Verify that unused keys were removed
    expect(enTranslations["common"]["unused-key"]).toBeUndefined();
    expect(arTranslations["common"]["unused-key"]).toBeUndefined();
    expect(enTranslations["unused-global-key"]).toBeUndefined();
    expect(arTranslations["unused-global-key"]).toBeUndefined();

    // Verify that used keys are still present
    expect(enTranslations["common"]["select-status"]).toBe("select-status");
    expect(arTranslations["common"]["select-status"]).toBe("select-status");
    expect(enTranslations["Hello Test!"]).toBe("Hello Test!");
    expect(arTranslations["Hello Test!"]).toBe("Hello Test!");
    expect(enTranslations["jsxNamespace"]["formattedMessageKey"]).toBe("formatted string with a dot");
    expect(arTranslations["jsxNamespace"]["formattedMessageKey"]).toBe("formatted string with a dot");
  });

  it("should not remove any keys when --clean flag is not set", async () => {
    // Create translation files with some unused keys
    const translationsWithUnusedKeys = {
      "common": {
        "select-status": "select-status",
        "unused-key": "This key is not used anywhere"
      },
      "unused-global-key": "This global key is not used anywhere",
      "Hello Test!": "Hello Test!"
    };

    // Write the same content to both en.json and ar.json
    fs.writeFileSync(
      `${testFolderPath}/messages/en.json`,
      JSON.stringify(translationsWithUnusedKeys, null, 2)
    );
    fs.writeFileSync(
      `${testFolderPath}/messages/ar.json`,
      JSON.stringify(translationsWithUnusedKeys, null, 2)
    );

    console.log("Translations before extraction (without clean):", translationsWithUnusedKeys);

    // Run extraction without --clean flag
    await runCli([
      "extract",
      "--config",
      "./_test/valid.config.json",
    ]);

    // Check that unused keys are still present
    const enTranslations = JSON.parse(
      fs.readFileSync(`${testFolderPath}/messages/en.json`, "utf-8")
    );
    const arTranslations = JSON.parse(
      fs.readFileSync(`${testFolderPath}/messages/ar.json`, "utf-8")
    );

    console.log("Translations after extraction (without clean):", enTranslations);

    // Verify that unused keys are still present
    expect(enTranslations["common"]["unused-key"]).toBe("This key is not used anywhere");
    expect(arTranslations["common"]["unused-key"]).toBe("This key is not used anywhere");
    expect(enTranslations["unused-global-key"]).toBe("This global key is not used anywhere");
    expect(arTranslations["unused-global-key"]).toBe("This global key is not used anywhere");
  });
});
