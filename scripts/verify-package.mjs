#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const pkg = json("package.json");
const plugin = json(".claude-plugin/plugin.json");
const marketplace = json(".claude-plugin/marketplace.json");
const mcp = json(".mcp.json");

assert.equal(plugin.name, "kling-ai");
assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
assert.equal(plugin.version, pkg.version, "plugin and package versions must match");
assert.equal(plugin.skills, "./skills/");
assert.equal(plugin.mcpServers, "./.mcp.json");
assert.deepEqual(marketplace.plugins.map(({ name, source }) => ({ name, source })), [
  { name: "kling-ai", source: "./" },
]);
assert.deepEqual(Object.keys(mcp.mcpServers), ["kling-ai"]);
assert.equal(mcp.mcpServers["kling-ai"].type, "http");
assert.equal(mcp.mcpServers["kling-ai"].url, "https://kling.ai/mcp/plugin");

const skills = ["kling-ai", "kling-ai-generate-image", "kling-ai-generate-video"];
for (const name of skills) {
  const path = `skills/${name}/SKILL.md`;
  const frontmatter = read(path).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? "";
  assert.equal(frontmatter.match(/^name:\s*([^\r\n]+)$/m)?.[1].trim(), name, path);
  assert.match(frontmatter, /^description:[ \t]*\S.+$/m, path);
}

const publicFiles = new Set([
  ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", ".mcp.json", "README.md", "LICENSE",
]);
function collect(directory) {
  for (const name of readdirSync(join(root, directory))) {
    if (name === ".DS_Store" || name === "__MACOSX" || name.startsWith("._")) continue;
    const path = join(directory, name);
    const stat = lstatSync(join(root, path));
    assert.ok(!stat.isSymbolicLink(), `symbolic link in skills: ${path}`);
    assert.ok(!name.startsWith(".") && !/\.(bak|tmp|log)$/i.test(name), `development file in skills: ${path}`);
    if (stat.isDirectory()) collect(path);
    else if (stat.isFile()) publicFiles.add(path);
  }
}
collect("skills");

// Follow WorkBuddy's public-package policy without storing an account model snapshot.
const rolloutOnlyName = /\bv4(?:[._-]?0)?(?:[ _-]?flash)?\b|(?<![\w.])4\.0(?![\w.])/i;
for (const path of publicFiles) {
  assert.ok(existsSync(join(root, path)), `missing public file: ${path}`);
  if (!/\.(md|json)$/.test(path)) continue;
  const content = read(path);
  assert.ok(!rolloutOnlyName.test(content), `rollout-only model name in public file: ${path}`);
  if (!path.endsWith(".md")) continue;
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
    const local = relative(root, resolve(root, dirname(path), target));
    assert.ok(local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local), `external file link in ${path}: ${target}`);
    assert.ok(publicFiles.has(local) && existsSync(join(root, local)), `missing or unpackaged link in ${path}: ${target}`);
  }
}

console.log(`Claude plugin ${pkg.version} verified: metadata, MCP connection, Skill identities, public links, and model-name policy.`);
