import { Translate } from "@google-cloud/translate/build/src/v2";
import Logger from "./logger";

const translate = new Translate({
  //   key: process.env.GOOGLE_TRANSLATE_API_KEY,
  key: "AIzaSyAXDo3kw7LENR3qksQsU5IcAhe7nUeNVK8",
});

export const translateText = async (
  text: string,
  targetLanguage: string
): Promise<string> => {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    Logger.error(`Error translating text: ${error}`);
    return text; // Return original text if translation fails
  }
};
