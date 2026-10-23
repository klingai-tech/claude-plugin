#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const pkg = json("package.json");
const marketplace = json(".claude-plugin/marketplace.json");
const regions = [
  { directory: "cn", name: "kling-ai-cn", displayName: "Kling AI CN", endpoint: "https://klingai.com/mcp/plugin" },
  { directory: "global", name: "kling-ai", displayName: "Kling AI Global", endpoint: "https://kling.ai/mcp/plugin" },
];

assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
assert.equal(marketplace.name, "klingai");
assert.deepEqual(marketplace.plugins.map(({ name, source }) => ({ name, source })),
  regions.map(({ directory, name }) => ({ name, source: `./${directory}` })));

for (const { directory, name, displayName, endpoint } of regions) {
  const pluginRoot = join(root, directory);
  const read = (path) => readFileSync(join(pluginRoot, path), "utf8");
  const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
  const mcp = JSON.parse(read(".mcp.json"));

  assert.equal(plugin.name, name);
  assert.equal(plugin.displayName, displayName);
  assert.equal(plugin.version, pkg.version, "plugin and package versions must match");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.mcpServers, "./.mcp.json");
  assert.deepEqual(Object.keys(mcp.mcpServers), ["kling-ai"]);
  assert.equal(mcp.mcpServers["kling-ai"].type, "http");
  assert.equal(mcp.mcpServers["kling-ai"].url, endpoint);

  const skills = ["kling-ai", "kling-ai-generate-image", "kling-ai-generate-video"];
  for (const skill of skills) {
    const path = `skills/${skill}/SKILL.md`;
    const frontmatter = read(path).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? "";
    assert.equal(frontmatter.match(/^name:\s*([^\r\n]+)$/m)?.[1].trim(), skill, `${directory}/${path}`);
    assert.match(frontmatter, /^description:[ \t]*\S.+$/m, `${directory}/${path}`);
  }
  assert.ok(read("skills/kling-ai/SKILL.md").includes(endpoint), `${directory}: Skill must use its own endpoint`);

  const publicFiles = new Set([".claude-plugin/plugin.json", ".mcp.json", "README.md", "LICENSE"]);
  function collect(folder) {
    for (const filename of readdirSync(join(pluginRoot, folder))) {
      if (filename === ".DS_Store" || filename === "__MACOSX" || filename.startsWith("._")) continue;
      const path = join(folder, filename);
      const stat = lstatSync(join(pluginRoot, path));
      assert.ok(!stat.isSymbolicLink(), `symbolic link in skills: ${directory}/${path}`);
      assert.ok(!filename.startsWith(".") && !/\.(bak|tmp|log)$/i.test(filename), `development file in skills: ${directory}/${path}`);
      if (stat.isDirectory()) collect(path);
      else if (stat.isFile()) publicFiles.add(path);
    }
  }
  collect("skills");

  for (const path of publicFiles) {
    assert.ok(existsSync(join(pluginRoot, path)), `missing public file: ${directory}/${path}`);
    assert.ok(!lstatSync(join(pluginRoot, path)).isSymbolicLink(), `symbolic link in package: ${directory}/${path}`);
    if (!path.endsWith(".md")) continue;
    const content = read(path);
    for (const other of regions.filter((region) => region.directory !== directory)) {
      assert.ok(!content.includes(other.endpoint), `wrong regional endpoint in ${directory}/${path}: ${other.endpoint}`);
    }
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
      const local = relative(pluginRoot, resolve(pluginRoot, dirname(path), target));
      assert.ok(local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local), `external file link in ${directory}/${path}: ${target}`);
      assert.ok(publicFiles.has(local) && existsSync(join(pluginRoot, local)), `missing or unpackaged link in ${directory}/${path}: ${target}`);
    }
  }
}

console.log(`Claude marketplace ${pkg.version} verified: two self-contained regional plugins, distinct identities, MCP endpoints, Skills, and public links.`);
