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
});
