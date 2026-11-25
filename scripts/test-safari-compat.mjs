import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/pages/background/dynamicRules.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const helperUrl = `data:text/javascript;base64,${ Buffer.from(outputText).toString("base64") }`;
const { updateDynamicRulesSafely } = await import(helperUrl);

const rule = (id) => ({
  id,
  priority: 1,
  action: { type: "block" },
  condition: { urlFilter: "example.com" },
});

test("warns and continues when the dynamic rules API is unavailable", async () => {
  const warnings = [];

  await updateDynamicRulesSafely(undefined, [ rule(1), rule(2) ], (message) => warnings.push(message));

  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /rule 1 is unavailable/);
  assert.match(warnings[1], /rule 2 is unavailable/);
});

test("continues installing later rules after one rule is rejected", async () => {
  const updates = [];
  const warnings = [];

  await updateDynamicRulesSafely(async (details) => {
    updates.push(details);
    if (details.addRules[0].id === 1) throw new Error("unsupported condition");
  }, [ rule(1), rule(2) ], (message, error) => warnings.push({ message, error }));

  assert.deepEqual(updates.map(({ addRules }) => addRules[0].id), [ 1, 2 ]);
  assert.deepEqual(updates.map(({ removeRuleIds }) => removeRuleIds), [ [ 1 ], [ 2 ] ]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].message, /rule 1 could not be installed/);
  assert.equal(warnings[0].error.message, "unsupported condition");
});

test("catches synchronous API failures", async () => {
  const warnings = [];

  await updateDynamicRulesSafely(() => {
    throw new Error("API unavailable");
  }, [ rule(3) ], (message, error) => warnings.push({ message, error }));

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].error.message, "API unavailable");
});