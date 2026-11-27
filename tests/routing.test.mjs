import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validate } from "./fixtures/routing-assertions.mjs";
import { discoveryLimits } from "./fixtures/workflow-mcp.mjs";

const scenario = { workflow: "fixture-cinema-27" };
const list = { name: "skill_catalog", args: {}, ok: true };
const entry = { name: "skill_catalog", args: { id: scenario.workflow }, ok: true };
const file = { name: "skill_catalog", args: { id: scenario.workflow, path: "references/kling-ai/SKILL.md" }, ok: true };
const generation = { name: "text_to_video", args: { model: "fixture-video", arguments: [{ name: "resolution", value: "720p" }] }, ok: true };
const event = (name, input) => ({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
const roots = { skillRoots: ["/fixture/plugin/skills"], cwd: "/fixture" };
const handoff = event("mcp__routing__skill_catalog", entry.args);

test("entry tells new text-only objectives to list before choosing an ID", () => {
  const entryGuide = readFileSync(new URL("../skills/kling-ai/SKILL.md", import.meta.url), "utf8");
  const routing = entryGuide.split("## Request routing")[1].split("## ")[0];
  const listing = routing.indexOf("call it without `id` or `path` before matching or drafting");
  assert.ok(routing.indexOf("including a text-only prompt, storyboard, or advertising plan") < listing);
  assert.match(routing, /Only an exact ID supplied by the user permits a first call with `id`/);
  assert.ok(listing >= 0);
});

test("creative routing requires complete declarations before declaring the catalog absent", () => {
  const entryGuide = readFileSync(new URL("../skills/kling-ai/SKILL.md", import.meta.url), "utf8");
  assert.match(entryGuide, /complete tool declarations, including all pagination/);
  assert.match(entryGuide, /pause routing before bundled creative steps/);
  const guide = readFileSync(new URL("../skills/kling-ai/references/official-skills.md", import.meta.url), "utf8");
  const discovery = guide.split("## Discover and select")[1].split("## Direct execution")[0];
  assert.match(discovery, /complete.*tools\/list/);
  assert.match(discovery, /all pagination/);
  for (const evidence of ["search miss", "truncated", "incomplete"]) assert.ok(discovery.includes(evidence));
  assert.match(discovery, /pause routing before bundled creative steps/);
  const fallback = guide.split("## Unavailable or unmatched")[1];
  assert.match(fallback, /complete declarations.*confirm.*absent/);
  assert.match(fallback, /successful catalog lookup.*no match/);
});

for (const [id] of Object.entries(discoveryLimits)) test(`${id} pauses routing without local creative fallback`, () => {
  const c = { discoveryLimited: true, noGeneration: true };
  const readRouting = event("Read", { file_path: "/fixture/plugin/skills/kling-ai/references/official-skills.md" });
  assert.doesNotThrow(() => validate(c, [], [readRouting], roots));
  for (const call of [list, entry, generation, { name: "who_am_i", args: {}, ok: true }]) {
    assert.throws(() => validate(c, [call], [readRouting], roots), /Discovery-limited routing/);
  }
  for (const local of [
    event("Read", { file_path: "/fixture/plugin/skills/kling-ai/references/prompt-examples.md" }),
    event("Read", { file_path: "/fixture/plugin/skills/kling-ai-generate-image/SKILL.md" }),
    event("Shell", { command: "cat plugin/skills/kling-ai-generate-video/references/scene-patterns.md" }),
    event("Skill", { skill: "routing-test:kling-ai-generate-image" }),
  ]) assert.throws(() => validate(c, [], [readRouting, local], roots), /creative/);
});

test("routing evidence requires a successful entry and required file before generation", () => {
  assert.doesNotThrow(() => validate(scenario, [list, entry, file, generation], []));
  for (const calls of [[list, generation], [entry, generation], [entry, generation, file], [{ ...entry, ok: false }, file, generation]]) {
    assert.throws(() => validate(scenario, calls, []));
  }
});

test("unmatched routes require successful discovery before generation", () => {
  const fallback = { ...generation, args: { ...generation.args, arguments: [{ name: "resolution", value: "1080p" }] } };
  assert.doesNotThrow(() => validate({ ordinary: true }, [list, fallback], []));
  assert.throws(() => validate({ ordinary: true }, [fallback, list], []));
  assert.throws(() => validate({ ordinary: true }, [{ ...list, ok: false }, fallback], []));
  assert.throws(() => validate({ ordinary: true }, [list, generation], []), /Bundled fallback/);
  assert.doesNotThrow(() => validate({ absent: true }, [fallback], []));
  assert.throws(() => validate({ absent: true }, [list, fallback], []), /Absent catalog/);
});

test("failed discovery, read, and prompt-only routes cannot generate", () => {
  assert.doesNotThrow(() => validate({ failure: true }, [{ ...entry, ok: false }], []));
  assert.throws(() => validate({ failure: true }, [{ ...entry, ok: false }, generation], []));
  assert.throws(() => validate({ ...scenario, noGeneration: true }, [list, entry, file, generation], []));
});

test("exact IDs and active objectives do not rediscover the catalog", () => {
  assert.doesNotThrow(() => validate({ ...scenario, direct: true }, [entry, file, generation], []));
  assert.throws(() => validate({ ...scenario, direct: true }, [list, entry, file, generation], []));
  assert.doesNotThrow(() => validate({ active: true }, [generation], []));
  assert.throws(() => validate({ active: true }, [list, generation], []));
});

test("handoff rejects bundled instruction reads and Skill invocation", () => {
  for (const block of [
    event("Read", { file_path: "/fixture/plugin/skills/kling-ai/SKILL.md" }),
    event("Read", { file_path: "plugin/skills/kling-ai-generate-video/references/motion-and-shots.md" }),
    event("Skill", { skill: "routing-test:kling-ai-generate-video" }),
  ]) assert.throws(() => validate(scenario, [entry, file, generation], [handoff, block], roots), /Bundled instructions/);
});

test("handoff permits user inputs, review artifacts and same-named remote files", () => {
  const events = [handoff,
    event("Read", { file_path: "/fixture/user-inputs/script.txt" }),
    event("Read", { file_path: "/fixture/results/review.txt" }),
    event("Read", { file_path: "/fixture/remote-package/references/kling-ai/SKILL.md" }),
    event("Skill", { skill: "pdf" }),
  ];
  assert.doesNotThrow(() => validate(scenario, [entry, file, generation], events, roots));
});

test("an active workflow keeps the same handoff boundary", () => {
  assert.throws(() => validate({ active: true }, [generation], [event("Read", { file_path: "/fixture/plugin/skills/kling-ai/SKILL.md" })], roots), /Bundled instructions/);
  assert.doesNotThrow(() => validate({ active: true }, [generation], [event("Read", { file_path: "/fixture/user-inputs/script.txt" })], roots));
});

test("shell read evidence distinguishes bundled paths from user files", () => {
  assert.throws(() => validate(scenario, [entry, file, generation], [handoff, event("Shell", { command: "cat plugin/skills/kling-ai/SKILL.md" })], roots), /Bundled instructions/);
  assert.doesNotThrow(() => validate(scenario, [entry, file, generation], [handoff, event("Shell", { command: "cat user-inputs/script.txt" })], roots));
});

test("required task data is read after handoff and before generation", () => {
  const c = { ...scenario, assetPaths: ["user-inputs/script.txt", "results/review.txt"] };
  const script = event("Read", { file_path: "/fixture/user-inputs/script.txt" });
  const review = event("Shell", { command: "cat results/review.txt" });
  const submit = event("mcp__routing__text_to_video", generation.args);
  assert.doesNotThrow(() => validate(c, [entry, file, generation], [handoff, script, review, submit], roots));
  assert.throws(() => validate(c, [entry, file, generation], [script, review, handoff, submit], roots), /Generation preceded/);
  assert.throws(() => validate(c, [entry, file, generation], [handoff, script, submit, review], roots), /Generation preceded/);
  assert.throws(() => validate(c, [entry, file, generation], [handoff], roots), /was not read/);
});

test("handoff still rejects bundled quality defaults", () => {
  const overridden = { ...generation, args: { ...generation.args, arguments: [{ name: "resolution", value: "1080p" }] } };
  assert.throws(() => validate(scenario, [entry, file, overridden], []));
});

test("text-only requests use the same remote-first routing and local fallback", () => {
  const text = { ...scenario, noGeneration: true };
  assert.doesNotThrow(() => validate(text, [list, entry, file], []));
  assert.throws(() => validate(text, [], []), /No fixture calls/);
  assert.throws(() => validate(text, [list], []), /must load successfully/);
  assert.doesNotThrow(() => validate({ ordinary: true, noGeneration: true }, [list], []));
  assert.doesNotThrow(() => validate({ absent: true, noGeneration: true }, [], []));
  assert.throws(() => validate({ absent: true, noGeneration: true }, [list], []), /Text-only/);
});

test("explicit workflow text requests load instructions without model or credit queries", () => {
  const text = { ...scenario, noGeneration: true };
  assert.doesNotThrow(() => validate(text, [list, entry, file], []));
  for (const name of ["who_am_i", "query_membership_and_credits"]) {
    assert.throws(() => validate(text, [list, entry, file, { name, args: {}, ok: true }], []), /queried models or credits/);
  }
  assert.doesNotThrow(() => validate({ ...text, active: true }, [], []));
  assert.throws(() => validate({ ...text, active: true }, [entry], []), /Text-only/);
});

test("missing calls cannot count as a pass and status queries stay scoped", () => {
  assert.throws(() => validate({ failure: true }, [], []));
  const query = { name: "query_tasks", args: { generationId: "fixture-existing" }, ok: true };
  assert.doesNotThrow(() => validate({ status: true, noGeneration: true }, [query], []));
  assert.throws(() => validate({ status: true, noGeneration: true }, [list, query], []));
});

test("direct execution preserves the prompt and settings without creative discovery", () => {
  const expectedSettings = { prompt: "保持这个提示词。", duration: "5", resolution: "720p" };
  const c = { bypass: true, expectedSettings };
  const capabilities = { name: "who_am_i", args: {}, ok: true };
  const credits = { name: "query_membership_and_credits", args: {}, ok: true };
  const submit = { ...generation, args: { ...generation.args, arguments: Object.entries(expectedSettings).map(([name, value]) => ({ name, value })) } };
  const calls = [capabilities, credits, submit];
  assert.doesNotThrow(() => validate(c, calls, []));
  assert.throws(() => validate(c, [list, ...calls], []), /discovered a creative workflow/);
  assert.throws(() => validate(c, [credits, submit], []), /skipped live capabilities/);
  assert.throws(() => validate(c, [capabilities, submit], []), /immediate credit check/);
  for (const name of Object.keys(expectedSettings)) {
    const changed = { ...submit, args: { ...submit.args, arguments: submit.args.arguments.map(arg => arg.name === name ? { ...arg, value: "changed" } : arg) } };
    assert.throws(() => validate(c, [capabilities, credits, changed], []), /Direct execution changed/);
  }
});

test("direct text and continuation skip bundled creative guidance", () => {
  const c = { bypass: true, noGeneration: true };
  assert.doesNotThrow(() => validate(c, [], []));
  assert.doesNotThrow(() => validate({ ...c, active: true }, [], []));
  assert.throws(() => validate(c, [list], []), /Text-only/);
  for (const path of ["prompt-construction", "scene-patterns", "motion-and-shots", "model-routing", "prompt-examples"]) {
    assert.throws(() => validate(c, [], [event("Read", { file_path: `/fixture/plugin/skills/kling-ai/references/${path}.md` })], roots), /creative guidance/);
  }
});

test("direct continuation queries a known task and never resubmits an ambiguous attempt", () => {
  const c = { bypass: true, active: true, noGeneration: true };
  const query = { name: "query_tasks", args: { generationId: "fixture-existing" }, ok: true };
  assert.doesNotThrow(() => validate({ ...c, status: true }, [query], []));
  assert.throws(() => validate({ ...c, status: true }, [query, generation], []), /Unexpected simulated generation/);
  assert.doesNotThrow(() => validate(c, [], []));
  assert.throws(() => validate(c, [generation], []), /Text-only/);
});

test("bundled continuation keeps the selected route even when a catalog appears", () => {
  const c = { active: true, activeRoute: "bundled" };
  const submit = { ...generation, args: { ...generation.args, arguments: [{ name: "resolution", value: "1080p" }] } };
  const read = event("Read", { file_path: "/fixture/plugin/skills/kling-ai-generate-video/SKILL.md" });
  assert.doesNotThrow(() => validate(c, [submit], [read], roots));
  assert.throws(() => validate(c, [list, submit], []), /rediscovered/);
  assert.throws(() => validate(c, [generation], []), /Bundled fallback/);
});

test("partial remote loads and mismatched versions cannot generate or reroute", () => {
  const c = { ...scenario, active: true, failure: true };
  const failed = { ...file, ok: false };
  assert.doesNotThrow(() => validate(c, [failed], []));
  assert.throws(() => validate(c, [list, failed], []), /rerouted/);
  assert.throws(() => validate(c, [failed, generation], []), /Unexpected simulated generation/);
  assert.doesNotThrow(() => validate({ ...scenario, versionMismatch: true }, [list, entry], []));
  assert.throws(() => validate({ ...scenario, versionMismatch: true }, [list, entry, file, generation], []), /Unexpected simulated generation/);
});
