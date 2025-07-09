import { parse, ParseResult } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type { Config } from "./types";

export function extractTranslationsFromSource(
  source: string,
  file: string,
  config?: Config
) {
  const namespaceMap = new Map<string, string>();
  const translations: {
    nameSpace: string;
    messageKey: string;
    string: string;
    file: string;
  }[] = [];

  let ast;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: [
        "jsx",
        "typescript",
        "topLevelAwait",
        "asyncGenerators",
        "classProperties",
        "decorators-legacy",
      ],
      allowAwaitOutsideFunction: true,
      errorRecovery: true, // Add error recovery
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to parse file ${file}: ${errorMessage}`);
    return translations; // Return empty array instead of crashing
  }

  // Type assertion to handle version compatibility between @babel/parser and @babel/traverse
  traverse(ast as any, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;

      // const t = useTranslations('namespace')
      if (
        t.isIdentifier(id) &&
        t.isCallExpression(init) &&
        t.isIdentifier(init.callee, { name: "useTranslations" })
      ) {
        const ns = init.arguments[0];
        const namespace =
          t.isStringLiteral(ns) || t.isTemplateLiteral(ns)
            ? (ns as t.StringLiteral).value ||
              (ns as t.TemplateLiteral).quasis?.[0]?.value?.raw ||
              ""
            : "";
        namespaceMap.set(id.name, namespace || "");
      }

      // const t = await getTranslations('en', 'namespace')
      if (
        t.isIdentifier(id) &&
        t.isAwaitExpression(init) &&
        t.isCallExpression(init.argument) &&
        t.isIdentifier(init.argument.callee, { name: "getTranslations" })
      ) {
        const args = init.argument.arguments;
        const nsArg = args[1];
        const namespace =
          t.isStringLiteral(nsArg) || t.isTemplateLiteral(nsArg)
            ? (nsArg as t.StringLiteral).value ||
              (nsArg as t.TemplateLiteral).quasis?.[0]?.value?.raw ||
              ""
            : "";
        namespaceMap.set(id.name, namespace || "");
      }
    },

    CallExpression(path) {
      const callee = path.node.callee;
      const args = path.node.arguments;

      // Match: t('key', ..., 'message') or any mapped variable like paymentT('key')
      if (t.isIdentifier(callee)) {
        const variableName = callee.name;
        const namespace = namespaceMap.get(variableName);

        if (namespace !== undefined) {
          const keyArg = args[0];
          const msgArg = args[2]; // optional

          if (t.isStringLiteral(keyArg) || t.isTemplateLiteral(keyArg)) {
            const key = t.isStringLiteral(keyArg)
              ? keyArg.value
              : keyArg.quasis?.[0]?.value?.raw || "";
            const message =
              t.isStringLiteral(msgArg) || t.isTemplateLiteral(msgArg)
                ? t.isStringLiteral(msgArg)
                  ? msgArg.value
                  : msgArg.quasis?.[0]?.value?.raw || ""
                : key;

            translations.push({
              nameSpace: namespace,
              messageKey: key,
              string: message,
              file,
            });
          }
        }
      }

      // Match: tVar.t('key')
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property, { name: "t" }) &&
        t.isIdentifier(callee.object)
      ) {
        const variable = callee.object.name;
        const ns = namespaceMap.get(variable) || "";

        const keyArg = args[0];
        if (t.isStringLiteral(keyArg) || t.isTemplateLiteral(keyArg)) {
          const key = t.isStringLiteral(keyArg)
            ? keyArg.value
            : keyArg.quasis?.[0]?.value?.raw || "";

          translations.push({
            nameSpace: ns,
            messageKey: key,
            string: key,
            file,
          });
        }
      }
    },

    JSXElement(path) {
      if (!config?.customJSXPattern) return;

      const openingElement = path.node.openingElement;
      if (!t.isJSXIdentifier(openingElement.name)) return;

      const elementName = openingElement.name.name;

      for (const pattern of config.customJSXPattern) {
        if (pattern.element === elementName) {
          const namespaceAttr = openingElement.attributes.find(
            (attr) =>
              t.isJSXAttribute(attr) &&
              attr.name.name === pattern.attributes.namespace
          );
          const stringAttr = openingElement.attributes.find(
            (attr) =>
              t.isJSXAttribute(attr) &&
              attr.name.name === pattern.attributes.string
          );
          const messageKeyAttr = openingElement.attributes.find(
            (attr) =>
              t.isJSXAttribute(attr) &&
              attr.name.name === pattern.attributes.messageKey
          );

          if (namespaceAttr && stringAttr && messageKeyAttr) {
            const namespace =
              t.isJSXAttribute(namespaceAttr) &&
              (t.isStringLiteral(namespaceAttr.value) ||
                t.isTemplateLiteral(namespaceAttr.value) ||
                (t.isJSXExpressionContainer(namespaceAttr.value) &&
                  (t.isStringLiteral(namespaceAttr.value.expression) ||
                    t.isTemplateLiteral(namespaceAttr.value.expression))))
                ? t.isStringLiteral(namespaceAttr.value)
                  ? namespaceAttr.value.value
                  : t.isTemplateLiteral(namespaceAttr.value)
                  ? (namespaceAttr.value as t.TemplateLiteral).quasis?.[0]
                      ?.value?.raw || ""
                  : t.isStringLiteral(namespaceAttr.value.expression)
                  ? namespaceAttr.value.expression.value
                  : (namespaceAttr.value.expression as t.TemplateLiteral)
                      .quasis?.[0]?.value?.raw || ""
                : "";
            const string =
              t.isJSXAttribute(stringAttr) &&
              (t.isStringLiteral(stringAttr.value) ||
                t.isTemplateLiteral(stringAttr.value) ||
                (t.isJSXExpressionContainer(stringAttr.value) &&
                  (t.isStringLiteral(stringAttr.value.expression) ||
                    t.isTemplateLiteral(stringAttr.value.expression))))
                ? t.isStringLiteral(stringAttr.value)
                  ? stringAttr.value.value
                  : t.isTemplateLiteral(stringAttr.value)
                  ? (stringAttr.value as t.TemplateLiteral).quasis?.[0]?.value
                      ?.raw || ""
                  : t.isStringLiteral(stringAttr.value.expression)
                  ? stringAttr.value.expression.value
                  : (stringAttr.value.expression as t.TemplateLiteral)
                      .quasis?.[0]?.value?.raw || ""
                : "";
            const messageKey =
              t.isJSXAttribute(messageKeyAttr) &&
              (t.isStringLiteral(messageKeyAttr.value) ||
                t.isTemplateLiteral(messageKeyAttr.value) ||
                (t.isJSXExpressionContainer(messageKeyAttr.value) &&
                  (t.isStringLiteral(messageKeyAttr.value.expression) ||
                    t.isTemplateLiteral(messageKeyAttr.value.expression))))
                ? t.isStringLiteral(messageKeyAttr.value)
                  ? messageKeyAttr.value.value
                  : t.isTemplateLiteral(messageKeyAttr.value)
                  ? (messageKeyAttr.value as t.TemplateLiteral).quasis?.[0]
                      ?.value?.raw || ""
                  : t.isStringLiteral(messageKeyAttr.value.expression)
                  ? messageKeyAttr.value.expression.value
                  : (messageKeyAttr.value.expression as t.TemplateLiteral)
                      .quasis?.[0]?.value?.raw || ""
                : "";

            if (namespace && string && messageKey) {
              translations.push({
                nameSpace: namespace,
                messageKey: messageKey,
                string: string,
                file,
              });
            }
          }
        }
      }
    },
  });

  return translations;
}
