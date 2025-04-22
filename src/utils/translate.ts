import { v2 } from "@google-cloud/translate";
import Logger from "./logger";

const translate = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY as string,
});

const BATCH_SIZE = 100;

// Add translation validation helpers
interface TranslationMetadata {
  category: "email" | "password" | "auth" | "general";
  expectedTerms?: string[];
  expectedTranslation?: string; // Add exact expected translation
}

// First, let's create a helper function to batch the translations
async function batchTranslateStrings(
  strings: string[],
  sourceLocale: string,
  targetLocale: string
): Promise<string[]> {
  try {
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      Logger.error("GOOGLE_TRANSLATE_API_KEY is not set");
      process.exit(1);
    }

    // Skip if source and target locales are the same
    if (sourceLocale === targetLocale) {
      return strings;
    }

    Logger.info(
      `Translating ${strings.length} strings from ${sourceLocale} to ${targetLocale}`
    );

    const [translations] = await translate.translate(strings, {
      from: sourceLocale,
      to: targetLocale,
    });

    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    Logger.error(`Translation failed: ${error}`);
    return strings;
  }
}

export async function translateBatch(
  content: Record<string, string>,
  sourceLocale: string,
  targetLocale: string
) {
  const translatedContent: Record<string, string> = {};

  //now for each key in the content, we need to translate the value
  for (const [key, value] of Object.entries(content)) {
    const translatedValue = await batchTranslateStrings(
      [value],
      sourceLocale,
      targetLocale
    );
    translatedContent[key] = translatedValue[0];
  }

  return translatedContent;
}
