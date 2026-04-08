import "server-only";

import path from "path";
import { CMS_LOCALES } from "./constants";
import { messagesRoot, readJson, writeJson } from "./storage";

function assertLocale(locale) {
  if (!CMS_LOCALES.includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
}

function getMessageFilePath(locale) {
  assertLocale(locale);
  return path.join(messagesRoot, `${locale}.json`);
}

export async function readLocaleMessages(locale) {
  return (await readJson(getMessageFilePath(locale), {})) || {};
}

export async function readRuntimeMessages(locale) {
  return readLocaleMessages(locale);
}

export async function listMessageNamespaces() {
  const referenceMessages = await readLocaleMessages(CMS_LOCALES[0]);
  return Object.keys(referenceMessages).sort((left, right) =>
    left.localeCompare(right)
  );
}

export async function readNamespaceBundle(namespace) {
  const bundle = {};

  for (const locale of CMS_LOCALES) {
    const localeMessages = await readLocaleMessages(locale);
    bundle[locale] = localeMessages[namespace] ?? {};
  }

  return bundle;
}

export async function updateNamespaceBundle(namespace, localizedValues) {
  for (const locale of CMS_LOCALES) {
    const localeMessages = await readLocaleMessages(locale);
    localeMessages[namespace] = localizedValues[locale] ?? {};
    await writeJson(getMessageFilePath(locale), localeMessages);
  }

  return readNamespaceBundle(namespace);
}
