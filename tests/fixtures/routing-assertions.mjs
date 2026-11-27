import assert from "node:assert/strict";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validate(c, calls, events, {
  skillRoots = [fileURLToPath(new URL("../../skills/", import.meta.url))],
  skillNames = ["kling-ai", "kling-ai-generate-image", "kling-ai-generate-video"],
  cwd = process.cwd(),
} = {}) {
  if (c.discoveryLimited) assert.equal(calls.length, 0, "Discovery-limited routing made provider calls");
  else if ((c.active || c.absent || c.bypass) && c.noGeneration && !c.status) assert.equal(calls.length, 0, "Text-only continuation/fallback made provider calls");
  else assert.ok(calls.length, "No fixture calls observed; not a routing pass");
  const generations = calls.filter(call => /^(text_to_|image_to_|omni_ref_video|motion_control)/.test(call.name));
  const catalog = calls.filter(call => call.name === "skill_catalog");
  if (c.noGeneration || c.failure || c.versionMismatch) assert.equal(generations.length, 0, "Unexpected simulated generation");
  else assert.equal(generations.length, 1, "Expected exactly one simulated generation");
  if (c.status) {
    assert.deepEqual(calls.map(call => call.name), ["query_tasks"]);
    assert.ok(JSON.stringify(calls[0].args).includes("fixture-existing"));
  } else if (c.discoveryLimited) assert.equal(catalog.length, 0, "Discovery-limited routing selected a workflow");
  else if (c.bypass) assert.equal(catalog.length, 0, "Direct execution discovered a creative workflow");
  else if (c.active && c.failure) {
    assert.ok(catalog.length && catalog.every(call => call.args.id === c.workflow && call.args.path), "Blocked continuation rerouted or reloaded the entry");
    assert.ok(catalog.some(call => !call.ok), "Expected active package read failure was not exercised");
  } else if (c.active) assert.equal(catalog.length, 0, "Active workflow was rediscovered");
  else if (c.absent) assert.equal(catalog.length, 0, "Absent catalog was called");
  else if (c.ordinary) {
    const listed = calls.findIndex(call => call.name === "skill_catalog" && !call.args.id && call.ok);
    assert.ok(listed >= 0, "No successful unmatched catalog lookup");
    if (generations.length) assert.ok(calls.indexOf(generations[0]) > listed, "Generation preceded unmatched catalog lookup");
    assert.ok(catalog.every(call => !call.args.id), "Unmatched request loaded a workflow");
  } else if (c.failure) assert.ok(catalog.some(call => !call.ok), "Expected catalog/read failure was not exercised");
  else if (c.versionMismatch) assert.ok(catalog.some(call => call.args.id === c.workflow && !call.args.path && call.ok), "Expected mismatched package entry was not read");
  else {
    const loaded = calls.findIndex(call => call.name === "skill_catalog" && call.args.id === c.workflow && !call.args.path && call.ok);
    const reference = calls.findIndex(call => call.name === "skill_catalog" && call.args.id === c.workflow && call.args.path === "references/kling-ai/SKILL.md" && call.ok);
    assert.ok(loaded >= 0 && reference > loaded, "Workflow and required package file must load successfully");
    if (generations.length) assert.ok(calls.indexOf(generations[0]) > reference, "Generation preceded required workflow files");
    if (c.direct) assert.ok(catalog.every(call => call.args.id), "Exact ID unnecessarily listed the catalog");
  }
  if (generations.length && c.bypass) {
    const submitted = generations[0].args;
    assert.equal(submitted.model, "fixture-video");
    for (const [name, value] of Object.entries(c.expectedSettings)) {
      assert.equal(submitted.arguments.find(arg => arg.name === name)?.value, value, `Direct execution changed ${name}`);
    }
    assert.ok(calls.some(call => call.name === "who_am_i" && call.ok), "Direct execution skipped live capabilities");
    assert.equal(calls[calls.indexOf(generations[0]) - 1]?.name, "query_membership_and_credits", "Direct execution skipped the immediate credit check");
  }
  const bundled = c.ordinary || c.absent || c.activeRoute === "bundled";
  if (generations.length && !bundled && !c.bypass) {
    assert.equal(generations[0].args.model, "fixture-video");
    assert.equal(generations[0].args.arguments.find(arg => arg.name === "resolution")?.value, "720p", "Bundled defaults overrode package settings");
  }
  if (generations.length && bundled) {
    assert.equal(generations[0].args.arguments.find(arg => arg.name === "resolution")?.value, "1080p", "Bundled fallback did not apply its quality default");
  }
  // A same-named remote reference must not be resolved against the bundled Skill.
  const roots = skillRoots.map(root => resolve(cwd, root));
  const insideBundle = path => roots.some(root => {
    const location = relative(root, resolve(cwd, path));
    return location === "" || (location !== ".." && !location.startsWith("../") && !isAbsolute(location));
  });
  const mentionsPath = (command, path) => [resolve(cwd, path), relative(cwd, resolve(cwd, path))]
    .filter(Boolean).some(value => new RegExp(`(?:^|[\\s"'=;(])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[/\\s"';&)]|$)`).test(command));
  const remainingAssets = new Set(c.assetPaths ?? []);
  let handedOff = Boolean(c.active && !c.bypass && !bundled);
  for (const event of events) for (const block of event.type === "assistant" ? event.message?.content ?? [] : []) {
    if (block.type !== "tool_use") continue;
    if (c.bypass || c.discoveryLimited) {
      const creativeReference = /(?:prompt-construction|scene-patterns|motion-and-shots|model-routing|prompt-examples)\.md/;
      const target = block.input?.file_path ?? block.input?.path ?? block.input?.command ?? "";
      if (["Read", "Shell"].includes(block.name)) assert.ok(!creativeReference.test(target), `${c.discoveryLimited ? "Discovery-limited routing" : "Direct execution"} read bundled creative guidance`);
      if (c.discoveryLimited) {
        if (["Read", "Shell"].includes(block.name)) assert.ok(!/kling-ai-generate-(?:image|video)(?:\/|\b)/.test(target), "Discovery-limited routing read bundled creative instructions");
        if (block.name === "Skill") assert.ok(!["kling-ai-generate-image", "kling-ai-generate-video"].includes(block.input?.skill?.split(":").at(-1)), "Discovery-limited routing invoked a bundled creative Skill");
      }
    }
    if (handedOff) {
      if (block.name === "Read") {
        const path = block.input?.file_path ?? block.input?.path;
        assert.equal(typeof path, "string", "Read evidence is missing its target path");
        assert.ok(!insideBundle(path), `Bundled instructions used after handoff: ${path}`);
        for (const asset of remainingAssets) if (resolve(cwd, asset) === resolve(cwd, path)) remainingAssets.delete(asset);
      }
      if (block.name === "Skill") {
        const name = block.input?.skill;
        assert.equal(typeof name, "string", "Skill evidence is missing its target name");
        assert.ok(!skillNames.includes(name.split(":").at(-1)), `Bundled instructions used after handoff: ${name}`);
      }
      if (block.name === "Shell") {
        const command = block.input?.command;
        assert.equal(typeof command, "string", "Shell evidence is missing its command");
        assert.ok(!roots.some(root => mentionsPath(command, root)), `Bundled instructions used after handoff: ${command}`);
        for (const asset of remainingAssets) if (mentionsPath(command, asset)) remainingAssets.delete(asset);
      }
      if (/__(text_to_|image_to_|omni_ref_video|motion_control)/.test(block.name)) {
        assert.equal(remainingAssets.size, 0, "Generation preceded required user input or review reads");
      }
    }
    if (block.name.endsWith("__skill_catalog") && block.input?.id && !block.input?.path &&
        catalog.some(call => call.ok && call.args.id === block.input.id && !call.args.path)) handedOff = true;
  }
  assert.equal(remainingAssets.size, 0, "Required user input or review was not read after handoff");
  if (c.noGeneration && !c.status && !c.failure) assert.ok(calls.every(call => !["who_am_i", "query_membership_and_credits"].includes(call.name)), "Prompt-only work queried models or credits");
}
