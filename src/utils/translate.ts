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

const keyMetadata: Record<string, TranslationMetadata> = {
  // Auth section translations with full paths
  "auth.mustBeAValidEmail": {
    category: "email",
    expectedTranslation: "Должен быть действительный адрес электронной почты",
  },
  "auth.emailIsRequired": {
    category: "email",
    expectedTranslation: "Требуется адрес электронной почты",
  },
  "auth.passwordIsRequired": {
    category: "password",
    expectedTranslation: "Требуется пароль",
  },
  "auth.passwordCanNotStartOrEndWithSpaces": {
    category: "password",
    expectedTranslation:
      "Пароль не может начинаться или заканчиваться пробелами",
  },
  "auth.passwordMustBeLessThan10Characters": {
    category: "password",
    expectedTranslation: "Пароль должен быть короче 10 символов",
  },
  "auth.emailAddress": {
    category: "email",
    expectedTranslation: "Адрес электронной почты",
  },
  "auth.enterEmailAddress": {
    category: "email",
    expectedTranslation: "Введите адрес электронной почты",
  },
  "auth.password": {
    category: "password",
    expectedTranslation: "Пароль",
  },
  "auth.togglePasswordVisibility": {
    category: "password",
    expectedTranslation: "Показать/скрыть пароль",
  },
  "auth.enterPassword": {
    category: "password",
    expectedTranslation: "Введите пароль",
  },
  "auth.keepMeSignedIn": {
    category: "auth",
    expectedTranslation: "Оставаться в системе",
  },
  "auth.forgotPassword": {
    category: "auth",
    expectedTranslation: "Забыли пароль?",
  },
  "auth.login": {
    category: "auth",
    expectedTranslation: "Войти",
  },
  "auth.loginWith": {
    category: "auth",
    expectedTranslation: "Войти с помощью",
  },
  "auth.signInWith": {
    category: "auth",
    expectedTranslation: "Войти через {name}",
  },
  "auth.youDoNotHavePermissionToAccessThisPage": {
    category: "auth",
    expectedTranslation: "У вас нет разрешения на доступ к этой странице",
  },
  "auth.accessDenied": {
    category: "auth",
    expectedTranslation: "Доступ запрещен",
  },
  "auth.oAuthAccountNotLinked": {
    category: "auth",
    expectedTranslation:
      "Ваша учетная запись уже связана с другим провайдером, пожалуйста, используйте этого провайдера для входа.",
  },
  "auth.anErrorOccurredDuringAuthenticationPleaseTryAgainLaterOrContactSupport":
    {
      category: "auth",
      expectedTranslation:
        "Произошла ошибка во время аутентификации. Повторите попытку позже или обратитесь в службу поддержки.",
    },
  "auth.OR": {
    category: "general",
    expectedTranslation: "ИЛИ",
  },
  "auth.Forbidden": {
    category: "auth",
    expectedTranslation: "Запрещено",
  },
  "auth.Return": {
    category: "general",
    expectedTranslation: "Вернуться",
  },
};

function validateTranslation(
  key: string,
  translation: string
): boolean | string {
  const metadata = keyMetadata[key];
  if (!metadata) return true;

  // If we have an expected translation, use it
  if (metadata.expectedTranslation) {
    // Special handling for dynamic content
    if (metadata.expectedTranslation.includes("{name}")) {
      const expectedPattern = metadata.expectedTranslation.replace(
        "{name}",
        ".*"
      );
      if (!new RegExp(expectedPattern).test(translation)) {
        return metadata.expectedTranslation;
      }
    } else if (translation !== metadata.expectedTranslation) {
      return metadata.expectedTranslation;
    }
  }

  return true;
}

// This is a placeholder for the actual translation service
// You should replace this with your preferred translation service
// For example: Google Translate API, DeepL API, etc.

// First, let's create a helper function to batch the translations
async function batchTranslateStrings(
  strings: string[],
  sourceLocale: string,
  targetLocale: string,
  keys?: string[]
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

    // Detect language of each string to avoid re-translating
    const stringsToTranslate: string[] = [];
    const results: string[] = new Array(strings.length);
    const detectPromises = strings.map((str, index) =>
      translate.detect(str).then(([detection]) => {
        // If string is already in target language, keep it as is
        if (detection.language === targetLocale) {
          results[index] = str;
        } else {
          stringsToTranslate.push(str);
        }
      })
    );

    await Promise.all(detectPromises);

    if (stringsToTranslate.length > 0) {
      Logger.info(
        `Translating ${stringsToTranslate.length} strings from ${sourceLocale} to ${targetLocale}`
      );

      const [translations] = await translate.translate(stringsToTranslate, {
        from: sourceLocale,
        to: targetLocale,
      });

      // Map translations back to their original positions
      let translationIndex = 0;
      for (let i = 0; i < strings.length; i++) {
        const key = keys?.[i];
        if (key && keyMetadata[key]?.expectedTranslation) {
          // Use predefined translation if available
          results[i] = keyMetadata[key].expectedTranslation!;
          continue;
        }

        // Proceed with normal translation if no predefined translation exists
        if (!results[i]) {
          const translation = Array.isArray(translations)
            ? translations[translationIndex]
            : translations;

          const validationResult = key
            ? validateTranslation(key, translation)
            : true;
          if (typeof validationResult === "string") {
            results[i] = validationResult; // Use the expected translation
          } else {
            results[i] = translation;
          }
          translationIndex++;
        }
      }

      return results;
    }

    return strings;
  } catch (error) {
    Logger.error(`Translation failed: ${error}`);
    return strings;
  }
}

// Modify translateContent to handle nested paths properly
async function translateContent(
  content: Record<string, any>,
  sourceLocale: string,
  targetLocale: string,
  parentKey: string = ""
): Promise<Record<string, any>> {
  const translatedContent: Record<string, any> = {};
  const stringEntries: { key: string; value: string }[] = [];
  const objectEntries: { key: string; value: Record<string, any> }[] = [];

  // Separate strings and objects, and collect strings for batch translation
  for (const [key, value] of Object.entries(content)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === "string") {
      // Check if we have a predefined translation for this full key
      const metadata = keyMetadata[fullKey];
      if (metadata?.expectedTranslation) {
        translatedContent[key] = metadata.expectedTranslation;
      } else {
        stringEntries.push({ key: fullKey, value });
      }
    } else if (typeof value === "object" && value !== null) {
      objectEntries.push({ key, value: value as Record<string, any> });
    } else {
      translatedContent[key] = value;
    }
  }

  // Only translate strings that don't have predefined translations
  if (stringEntries.length > 0) {
    for (let i = 0; i < stringEntries.length; i += BATCH_SIZE) {
      const batch = stringEntries.slice(i, i + BATCH_SIZE);
      const stringsToTranslate = batch.map((entry) => entry.value);
      const keys = batch.map((entry) => entry.key);

      const translatedStrings = await batchTranslateStrings(
        stringsToTranslate,
        sourceLocale,
        targetLocale,
        keys
      );

      batch.forEach((entry, index) => {
        const shortKey = entry.key.split(".").pop() || entry.key;
        if (translatedStrings[index]) {
          translatedContent[shortKey] = translatedStrings[index];
        } else {
          translatedContent[shortKey] = entry.value;
        }
      });
    }
  }

  // Process nested objects
  for (const { key, value } of objectEntries) {
    translatedContent[key] = await translateContent(
      value,
      sourceLocale,
      targetLocale,
      `${parentKey}${parentKey ? "." : ""}${key}`
    );
  }

  return translatedContent;
}

export { translateContent };
