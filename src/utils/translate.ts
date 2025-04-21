import { v2 } from "@google-cloud/translate";
import Logger from "./logger";

const translate = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

// This is a placeholder for the actual translation service
// You should replace this with your preferred translation service
// For example: Google Translate API, DeepL API, etc.
export async function translateText(
  text: string,
  sourceLocale: string,
  targetLocale: string
): Promise<string> {
  try {
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      Logger.error("GOOGLE_TRANSLATE_API_KEY is not set");
      process.exit(1);
    }

    if (!sourceLocale || !targetLocale) {
      Logger.error(`Unsupported locale: ${sourceLocale} or ${targetLocale}`);
      return text;
    }

    Logger.info(
      `Translating "${text}" from ${sourceLocale} to ${targetLocale}`
    );

    const [translation] = await translate.translate(text, {
      from: sourceLocale,
      to: targetLocale,
    });

    return translation;
  } catch (error) {
    Logger.error(`Translation failed: ${error}`);
    return text; // Return original text if translation fails
  }
}
