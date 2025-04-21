import { Translate } from "@google-cloud/translate/build/src/v2";
import Logger from "./logger";

if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
  Logger.error("GOOGLE_TRANSLATE_API_KEY is not set");
  process.exit(1);
}

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

// Map our locale codes to Google Translate language codes
const localeToGoogleCode: Record<string, string> = {
  en: "en",
  ar: "ar",
  // Add more mappings as needed
};

// This is a placeholder for the actual translation service
// You should replace this with your preferred translation service
// For example: Google Translate API, DeepL API, etc.
export async function translateText(
  text: string,
  sourceLocale: string,
  targetLocale: string
): Promise<string> {
  try {
    const sourceLanguage = localeToGoogleCode[sourceLocale];
    const targetLanguage = localeToGoogleCode[targetLocale];

    if (!sourceLanguage || !targetLanguage) {
      Logger.error(`Unsupported locale: ${sourceLocale} or ${targetLocale}`);
      return text;
    }

    Logger.info(
      `Translating "${text}" from ${sourceLocale} to ${targetLocale}`
    );

    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });

    return translation;
  } catch (error) {
    Logger.error(`Translation failed: ${error}`);
    return text; // Return original text if translation fails
  }
}
