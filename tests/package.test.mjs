import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "claude-plugin-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const path of ["package.json", "plugin.json", "gemini-extension.json", ".claude-plugin", ".mcp.json", "mcp.json", "README.md", "LICENSE", "scripts", "skills"]) {
    cpSync(join(root, path), join(directory, path), { recursive: true });
  }
  return directory;
}
function verify(directory) {
  // The validator must resolve its package from its own path, not the caller's cwd.
  const result = spawnSync(process.execPath, [join(directory, "scripts/verify-package.mjs")], {
    cwd: tmpdir(), encoding: "utf8",
  });
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}
function changeJson(directory, path, change) {
  const fullPath = join(directory, path);
  const value = JSON.parse(readFileSync(fullPath, "utf8"));
  change(value);
  writeFileSync(fullPath, JSON.stringify(value, null, 2) + "\n");
}
function append(directory, path, text) {
  const fullPath = join(directory, path);
  writeFileSync(fullPath, readFileSync(fullPath, "utf8") + text);
}

test("isolated package validates without a parent repository or development docs", (t) => {
  const result = verify(fixture(t));
  assert.equal(result.status, 0, result.output);
});

test("release versions are not confused with model names", (t) => {
  const directory = fixture(t);
  for (const path of ["package.json", "plugin.json", "gemini-extension.json", ".claude-plugin/plugin.json"]) {
    changeJson(directory, path, (value) => { value.version = "1.4.0"; });
  }
  const result = verify(directory);
  assert.equal(result.status, 0, result.output);
});

test("V4 model names are allowed in the public package", (t) => {
  const directory = fixture(t);
  append(directory, "README.md", "\nV4 · V4 Flash · kling-video-v4_0 · kling-video-v4_0_flash · 可灵4.0\n");
  const result = verify(directory);
  assert.equal(result.status, 0, result.output);
});

test("README and Skill offer the same five suggested prompts per language", () => {
  const suggestions = (path) => {
    const content = readFileSync(join(root, path), "utf8");
    const section = content.split(/^#{2,3} Suggested prompts\n/m)[1].split(/^#{2,3} /m)[0];
    return [...section.matchAll(/^- (.+)$/gm)].map(([, prompt]) => prompt);
  };
  const prompts = suggestions("README.md");
  assert.deepEqual(prompts, suggestions("skills/kling-ai/references/prompt-examples.md"));
  assert.equal(prompts.length, 10);
  for (const [examples, expected] of [
    [prompts.slice(0, 5), [
      /Kling Image 4\.0.*three 8K images in one request/, /Kling 4\.0 to generate/,
      /Kling 4\.0 Flash.*20-second, 720p/, /motion library/, /reusable Element/,
    ]],
    [prompts.slice(5), [
      /可灵图片 4\.0.*一次生成 3 张 8K 连续组图/, /可灵 4\.0 生成/,
      /可灵 4\.0 Flash.*20 秒、720p/, /动作库/, /可复用主体/,
    ]],
  ]) {
    expected.forEach((pattern, index) => assert.match(examples[index], pattern));
  }
  assert.doesNotMatch(prompts.join("\n"), /最新|latest|\bV4\b/i);
});

test("new linked Skill references are discovered automatically", (t) => {
  const directory = fixture(t);
  writeFileSync(join(directory, "skills/kling-ai/references/extra.md"), "# Extra reference\n");
  append(directory, "skills/kling-ai/SKILL.md", "\n[Extra](references/extra.md)\n");
  const result = verify(directory);
  assert.equal(result.status, 0, result.output);
});

for (const [label, mutate, expected] of [
  ["version mismatch", (dir) => changeJson(dir, ".claude-plugin/plugin.json", (v) => { v.version = "9.0.0"; }), /versions must match/],
  ...["plugin.json", "gemini-extension.json"].map((path) => [
    `${path} version mismatch`, (dir) => changeJson(dir, path, (v) => { v.version = "9.0.0"; }), /versions must match/,
  ]),
  ["wrong MCP endpoint", (dir) => changeJson(dir, ".mcp.json", (v) => { v.mcpServers["kling-ai"].url = "https://example.invalid/mcp"; }), /PRT MCP endpoint/],
  ["wrong portable MCP endpoint", (dir) => changeJson(dir, "mcp.json", (v) => { v.mcpServers["kling-ai"].url = "https://example.invalid/mcp"; }), /PRT MCP endpoint/],
  ["wrong Gemini MCP endpoint", (dir) => changeJson(dir, "gemini-extension.json", (v) => { Object.values(v.mcpServers)[0].url = "https://example.invalid/mcp"; }), /PRT MCP endpoint/],
  ["PRT endpoint must not append plugin", (dir) => changeJson(dir, ".mcp.json", (v) => { v.mcpServers["kling-ai"].url += "/plugin"; }), /PRT MCP endpoint/],
  ["second MCP connection", (dir) => changeJson(dir, ".mcp.json", (v) => { v.mcpServers.extra = {}; }), /extra/],
  ["wrong marketplace source", (dir) => changeJson(dir, ".claude-plugin/marketplace.json", (v) => { v.plugins[0].source = "../other"; }), /\.\.\/other/],
  ["missing Skill", (dir) => rmSync(join(dir, "skills/kling-ai-generate-video/SKILL.md")), /ENOENT/],
  ...["skills/kling-ai/references/capability-discovery.md", "skills/kling-ai/references/model-parameters.md", "skills/kling-ai-generate-video/references/model-routing.md"].map((path) => [
    `missing ${path}`, (dir) => rmSync(join(dir, path)), /missing or unpackaged link/,
  ]),
  ["unpackaged reference", (dir) => {
    mkdirSync(join(dir, "docs"));
    writeFileSync(join(dir, "docs/private.md"), "# Test fixture\n");
    append(dir, "README.md", "\n[Private](docs/private.md)\n");
  }, /missing or unpackaged link/],
  ["external filesystem reference", (dir) => append(dir, "README.md", "\n[External](../outside.md)\n"), /external file link/],
  ["backup file in skills", (dir) => writeFileSync(join(dir, "skills/notes.bak"), "fixture"), /development file/],
  ["hidden file in skills", (dir) => writeFileSync(join(dir, "skills/.credentials"), "dummy fixture"), /development file/],
  ["symlink in skills", (dir) => symlinkSync("../README.md", join(dir, "skills/external.md")), /symbolic link/],
  ["name outside frontmatter", (dir) => {
    const path = join(dir, "skills/kling-ai/SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("name: kling-ai\n", "") + "\nname: kling-ai\n");
  }, /skills\/kling-ai\/SKILL\.md/],
]) {
  test(`rejects ${label}`, (t) => {
    const directory = fixture(t);
    mutate(directory);
    const result = verify(directory);
    assert.notEqual(result.status, 0, result.output);
    assert.match(result.output, expected);
  });
}
