import Logger from "./logger";

export const flattenObject = async (obj: Record<string, any>) => {
  const flattened: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        console.log("flattening key", key, value);

        const nested = await flattenObject(value);
        for (const nestedKey in nested) {
          if (
            typeof nested[nestedKey] === "string" &&
            nested[nestedKey].includes(".")
          ) {
            Logger.warn(
              `Found a dot in the key "${nestedKey}", this may cause issues with next-intl`
            );
          }
          // lets temporarily replace the dot with a special charatcer combo to avoid conflicts
          flattened[`${key}.${nestedKey}`] = nested[nestedKey].replace(
            ".",
            "::"
          );
          console.log(
            "flattened key",
            `${key}.${nestedKey}`,
            nested[nestedKey]
          );
        }
      } else {
        if (typeof value === "string" && value.includes(".")) {
          // lets temporarily replace the dot with a special charatcer combo to avoid conflicts
          Logger.warn(
            `Found a dot in the key "${key}", this may cause issues with next-intl`
          );
          console.log("flattened key", key, value);
          const escapedKey = key.replace(".", "::");
          flattened[escapedKey] = value.replace(".", "::");
          console.log("flattened key", key, flattened[key]);
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
