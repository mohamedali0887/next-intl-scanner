import Logger from "./logger";

export const checkForDots = (string: string) => {
  if (string.includes(".")) {
    Logger.error(
      `Found a dot in the string "${string}", this will break next-intl translations as keys will be interpreted as namespaces`
    );
    Logger.error(
      "Please rename the key to remove the dot or refer to the readme file for using custom elements that support dot notation"
    );
    process.exit(1);
  }
};
export const flattenObject = async (obj: Record<string, any>) => {
  const flattened: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value && typeof value === "object" && !Array.isArray(value)) {
        // This is a nested object (namespace), don't check the key for dots
        const nested = await flattenObject(value);
        for (const nestedKey in nested) {
          // Check the nested key for dots (these are actual translation keys)
          checkForDots(nestedKey);
          // lets temporarily replace the dot with a special charatcer combo to avoid conflicts
          flattened[`${key}.${nestedKey}`] = nested[nestedKey].replace(
            ".",
            "::"
          );
        }
      } else {
        // This is a direct key-value pair, check the key for dots
        checkForDots(key);
        if (typeof value === "string" && value.includes(".")) {
          const escapedKey = key.replace(".", "::");
          flattened[escapedKey] = value.replace(".", "::");
        } else {
          flattened[key] = value;
        }
      }
    }
  }

  return flattened;
};

export const restoreNamespaces = async (obj: Record<string, any>) => {
  if (!obj || typeof obj !== "object") {
    console.error("Invalid input object:", obj);
    return {};
  }
  const restored: Record<string, any> = {};

  for (const key in obj) {
    if (key.includes(".")) {
      const [namespace, translationKey] = key.split(".");
      if (!restored[namespace]) {
        restored[namespace] = {};
      }
      //lets replace back the special character combo
      restored[namespace][translationKey] = obj[key].replace("::", ".");
    } else {
      if (typeof obj[key] === "string" && obj[key].includes("::")) {
        const escapedKey = key.replace("::", ".");
        restored[escapedKey] = obj[key].replace("::", ".");
      } else {
        restored[key] = obj[key];
      }
    }
  }

  return restored;
};
