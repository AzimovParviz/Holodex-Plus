import type { DeclarativeNetRequest } from "webextension-polyfill";

type DynamicRuleUpdateOptions = {
  removeRuleIds: number[];
  addRules: DeclarativeNetRequest.Rule[];
};

type DynamicRuleUpdater = (options: DynamicRuleUpdateOptions) => Promise<unknown>;
type WarningHandler = (message: string, error?: unknown) => void;

export async function updateDynamicRulesSafely(
  updateDynamicRules: DynamicRuleUpdater | undefined,
  rules: DeclarativeNetRequest.Rule[],
  warn: WarningHandler = (message, error) => console.warn(message, error),
) {
  for (const rule of rules) {
    if (!updateDynamicRules) {
      warn(`[Holodex+] Dynamic network rule ${rule.id} is unavailable in this browser.`);
      continue;
    }

    try {
      await updateDynamicRules({
        removeRuleIds: [ rule.id ],
        addRules: [ rule ],
      });
    } catch (error) {
      warn(
        `[Holodex+] Dynamic network rule ${rule.id} could not be installed; the API may be unsupported or site access may not be granted.`,
        error,
      );
    }
  }
}