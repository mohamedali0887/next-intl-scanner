import { v2 } from "@google-cloud/translate";
import Logger from "./logger";

const translate = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY as string,
});

// Maximum number of strings to translate in a single request
const BATCH_SIZE = 100;

async function batchTranslateStrings(
  content: Record<string, string>,
  sourceLocale: string,
  targetLocale: string
): Promise<Record<string, string>> {
  try {
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      Logger.error("GOOGLE_TRANSLATE_API_KEY is not set");
      process.exit(1);
    }

    // Skip if source and target locales are the same
    if (sourceLocale === targetLocale) {
      return content;
    }

    Logger.info(
      `Translating ${
        Object.keys(content).length
      } strings from ${sourceLocale} to ${targetLocale}`
    );

    const keys = Object.keys(content);
    const values = Object.values(content);
    const translatedContent: Record<string, string> = {};

    // Process translations in chunks
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const chunk = values.slice(i, i + BATCH_SIZE);
      Logger.info(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          values.length / BATCH_SIZE
        )}`
      );

      const [translations] = await translate.translate(chunk, {
        from: sourceLocale,
        to: targetLocale,
      });

      // Map translations back to their keys
      for (let j = 0; j < chunk.length; j++) {
        translatedContent[keys[i + j]] = translations[j];
      }
    }

    return translatedContent;
  } catch (error) {
    Logger.error(`Translation failed: ${error}`);
    return content;
  }
}

export async function translateBatch(
  content: Record<string, string>,
  sourceLocale: string,
  targetLocale: string
) {
  const translated = await batchTranslateStrings(
    content,
    sourceLocale,
    targetLocale
  );

  //now for each key in the content, we need to translate the value

  return translated;
}
