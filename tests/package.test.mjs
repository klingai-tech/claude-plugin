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
  for (const path of ["package.json", ".claude-plugin", "README.md", "LICENSE", "scripts", "cn", "global"]) {
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

test("isolated marketplace validates without a parent repository or development docs", (t) => {
  const result = verify(fixture(t));
  assert.equal(result.status, 0, result.output);
});

test("release versions are not confused with model names", (t) => {
  const directory = fixture(t);
  for (const path of ["package.json", "cn/.claude-plugin/plugin.json", "global/.claude-plugin/plugin.json"]) {
    changeJson(directory, path, (value) => { value.version = "1.4.0"; });
  }
  const result = verify(directory);
  assert.equal(result.status, 0, result.output);
});

test("V4 model names are allowed in the public package", (t) => {
  const directory = fixture(t);
  append(directory, "cn/README.md", "\nV4 · V4 Flash · kling-video-v4_0 · kling-video-v4_0_flash · 可灵4.0\n");
  const result = verify(directory);
  assert.equal(result.status, 0, result.output);
});

test("new linked Skill references are discovered automatically", (t) => {
  const directory = fixture(t);
  writeFileSync(join(directory, "global/skills/kling-ai/references/extra.md"), "# Extra reference\n");
  append(directory, "global/skills/kling-ai/SKILL.md", "\n[Extra](references/extra.md)\n");
  const result = verify(directory);
  assert.equal(result.status, 0, result.output);
});

for (const region of ["cn", "global"]) {
  const path = (file) => `${region}/${file}`;
  for (const [label, mutate, expected] of [
    ["version mismatch", (dir) => changeJson(dir, path(".claude-plugin/plugin.json"), (v) => { v.version = "9.0.0"; }), /versions must match/],
    ["wrong plugin identity", (dir) => changeJson(dir, path(".claude-plugin/plugin.json"), (v) => { v.name = "other-region"; }), /other-region/],
    ["wrong MCP endpoint", (dir) => changeJson(dir, path(".mcp.json"), (v) => { v.mcpServers["kling-ai"].url = "https://example.invalid/mcp"; }), /example\.invalid/],
    ["second MCP connection", (dir) => changeJson(dir, path(".mcp.json"), (v) => { v.mcpServers.extra = {}; }), /extra/],
    ["missing Skill", (dir) => rmSync(join(dir, path("skills/kling-ai-generate-video/SKILL.md"))), /ENOENT/],
    ...["skills/kling-ai/references/capability-discovery.md", "skills/kling-ai/references/model-parameters.md", "skills/kling-ai-generate-video/references/model-routing.md"].map((file) => [
      `missing ${file}`, (dir) => rmSync(join(dir, path(file))), /missing or unpackaged link/,
    ]),
    ["unpackaged reference", (dir) => {
      mkdirSync(join(dir, path("docs")));
      writeFileSync(join(dir, path("docs/private.md")), "# Test fixture\n");
      append(dir, path("README.md"), "\n[Private](docs/private.md)\n");
    }, /missing or unpackaged link/],
    ["reference to the other regional package", (dir) => append(dir, path("README.md"), `\n[Other](../${region === "cn" ? "global" : "cn"}/README.md)\n`), /external file link/],
    ["other region's endpoint in a Skill", (dir) => {
      const endpoint = region === "cn" ? "https://kling.ai/mcp/plugin" : "https://klingai.com/mcp/plugin";
      append(dir, path("skills/kling-ai/references/tool-workflows.md"), `\n${endpoint}\n`);
    }, /wrong regional endpoint/],
    ["backup file in skills", (dir) => writeFileSync(join(dir, path("skills/notes.bak")), "fixture"), /development file/],
    ["hidden file in skills", (dir) => writeFileSync(join(dir, path("skills/.credentials")), "dummy fixture"), /development file/],
    ["symlink in skills", (dir) => symlinkSync("../README.md", join(dir, path("skills/external.md"))), /symbolic link/],
    ["name outside frontmatter", (dir) => {
      const file = join(dir, path("skills/kling-ai/SKILL.md"));
      writeFileSync(file, readFileSync(file, "utf8").replace("name: kling-ai\n", "") + "\nname: kling-ai\n");
    }, /skills\/kling-ai\/SKILL\.md/],
  ]) {
    test(`${region}: rejects ${label}`, (t) => {
      const directory = fixture(t);
      mutate(directory);
      const result = verify(directory);
      assert.notEqual(result.status, 0, result.output);
      assert.match(result.output, expected);
    });
  }
}

for (const [label, mutate] of [
  ["wrong regional source", (v) => { v.plugins[0].source = "./global"; }],
  ["duplicate plugin identity", (v) => { v.plugins[0].name = v.plugins[1].name; }],
  ["missing regional entry", (v) => { v.plugins.pop(); }],
]) {
  test(`catalog rejects ${label}`, (t) => {
    const directory = fixture(t);
    changeJson(directory, ".claude-plugin/marketplace.json", mutate);
    assert.notEqual(verify(directory).status, 0);
  });
}
