// Runs a real agent host against a stdio fixture; no Kling service is configured.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discoveryLimits, executionGuide, packageGuide } from "../tests/fixtures/workflow-mcp.mjs";
import { validate } from "../tests/fixtures/routing-assertions.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Usage: node scripts/test-workflow-routing.mjs [--host claude|codex] [--case all|id,id] [--skill-root path] [--entry name] [--output path]");
  process.exit(0);
}
function option(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  assert.ok(args[index + 1] && !args[index + 1].startsWith("--"), `Missing value for ${name}`);
  return args[index + 1];
}
const skillRoot = resolve(option("--skill-root", join(root, "skills")));
const entry = option("--entry", "kling-ai");
const selected = option("--case", "all");
const hostName = option("--host", "claude");
assert.ok(["claude", "codex"].includes(hostName), "--host must be claude or codex");
const output = resolve(option("--output") ?? mkdtempSync(join(tmpdir(), "kling-routing-")));
mkdirSync(output, { recursive: true });
const prompt = "夜市里，摊主把最后一碗面递给雨中的孩子，孩子转身露出警徽。";
const approved = "用户已明确授权所需的一次生成，模型和规格由所选流程决定。请实际调用工具完成本次任务。";
const priorRoutes = [join(skillRoot, entry, "SKILL.md"), join(skillRoot, entry, "references/official-skills.md"), join(skillRoot, entry, "references/official-workflows.md")].filter(existsSync).map(path => readFileSync(path, "utf8")).join("\n");
const active = `Trusted prior task context, not a new user request: The entry and routing instructions previously read were:\n${priorRoutes}\nThe previous short-drama objective loaded fixture-cinema-27 version 1.0.0 and its required references successfully. For that objective the package instructions were:\n${packageGuide}\n${executionGuide}`;
const directSettings = { prompt, duration: "5", resolution: "720p" };
const directRequest = `完整提示词：${prompt} 明确保留原提示词和已确认方案，跳过本地和远端创作流程，只做执行检查并生成一次。已确认模型 fixture-video，时长5秒，分辨率720p。用户已授权这些设置的一次生成。`;
const directContext = `Trusted prior task context: Routing was completed for this same objective. Active route: direct; not attempted; original prompt: ${prompt}; confirmed model fixture-video, duration 5, resolution 720p. User authorized exactly one submission for these settings.\n${priorRoutes}`;
const bundledContext = `Trusted prior task context: Routing was completed for this same objective while the catalog was absent. Active route: bundled; not attempted. Original prompt: ${prompt}. Keep the bundled route even if the current connection now exposes a matching catalog.\n${priorRoutes}`;
const partialContext = `Trusted prior task context: Active route remote, selected fixture-cinema-27 version 1.0.0 for this same short-drama objective. The entry was loaded successfully, but the required references/kling-ai/SKILL.md failed to load. No generation was attempted. Resume only the missing read with this exact package/version; do not rediscover or fall back. Entry instructions:\n${packageGuide}\nRouting instructions:\n${priorRoutes}`;
const cases = [
  ...Object.entries(discoveryLimits).map(([id, limitation]) => ({
    id, discoveryLimited: true, noGeneration: true,
    prompt: "参考商品图做一条20–30秒信息流广告，设计不同人群的开场钩子，先出方案。",
    context: `Trusted host discovery state: ${limitation} The tools exposed to this turn are only a partial set, not the configured connection's complete declarations. Complete declarations cannot be retrieved this turn.`,
  })),
  { id: "short-drama", prompt: `用可灵制作一段夜市短剧：${prompt}${approved}`, workflow: "fixture-cinema-27" },
  { id: "complete-prompt", prompt: `完整提示词已经写好，直接生成一集短剧：${prompt}${approved}`, workflow: "fixture-cinema-27" },
  { id: "brand", prompt: `做一条茶叶品牌宣传片，晨雾里展开茶叶，最后出现品牌名“山间”。${approved}`, workflow: "fixture-brand-83" },
  { id: "explicit-id", prompt: `使用工作流 fixture-cinema-27 生成短剧，提示词：${prompt}${approved}`, workflow: "fixture-cinema-27", direct: true },
  { id: "ordinary", prompt: `用可灵按提示词生成5秒视频：一朵云缓慢飘过蓝天。${approved}`, ordinary: true },
  { id: "catalog-absent", prompt: `用可灵按提示词生成5秒视频：一朵云缓慢飘过蓝天。${approved}`, absent: true },
  { id: "prompt-only", prompt: `只写一段夜市短剧提示词：${prompt} 不生成。`, workflow: "fixture-cinema-27", noGeneration: true },
  { id: "catalog-on-page-two", prompt: `只写一段夜市短剧提示词：${prompt} 不生成。`, workflow: "fixture-cinema-27", noGeneration: true },
  { id: "unmatched-text", prompt: "只写一段白云飘过蓝天的视频提示词，不生成。", ordinary: true, noGeneration: true },
  { id: "absent-text", prompt: "只写一段白云飘过蓝天的视频提示词，不生成。", absent: true, noGeneration: true },
  { id: "workflow-text", prompt: `使用官方工作流 fixture-cinema-27，只写夜市短剧提示词：${prompt} 不生成。`, workflow: "fixture-cinema-27", direct: true, noGeneration: true },
  { id: "active-text", prompt: `继续刚才的短剧，只修改台词，不生成：${prompt}`, context: active, active: true, workflow: "fixture-cinema-27", noGeneration: true },
  { id: "handoff-assets", prompt: `使用工作流 fixture-cinema-27 制作短剧。先加载工作流及其必读文件，再读取 user-inputs/script.txt 和 results/review.txt，按剧本和审片意见制作。${approved}`, workflow: "fixture-cinema-27", direct: true, assetPaths: ["user-inputs/script.txt", "results/review.txt"] },
  { id: "resume", prompt: `继续刚才的短剧，提示词：${prompt}${approved}`, context: active, active: true },
  { id: "downstream", prompt: `当前短剧的执行步骤已就绪，提示词：${prompt}${approved}`, context: active, active: true },
  { id: "new-objective", prompt: `结束之前的短剧任务。现在做一条茶叶品牌宣传片：茶叶在晨雾中展开。${approved}`, context: active, workflow: "fixture-brand-83" },
  { id: "bypass-plan", prompt: directRequest, bypass: true, expectedSettings: directSettings },
  { id: "bypass-active", prompt: directRequest, context: active, bypass: true, expectedSettings: directSettings },
  { id: "bypass-text", prompt: `原提示词：${prompt} 明确保留原文并跳过本地和远端创作流程，只返回原提示词，不生成。`, bypass: true, noGeneration: true, expectedText: prompt },
  { id: "resume-direct", prompt: "继续刚才的任务，按已确认设置提交一次。", context: directContext, active: true, bypass: true, expectedSettings: directSettings },
  { id: "resume-direct-known", prompt: "继续刚才的任务，给我结果。", context: `${directContext}\nUpdated submission state: submitted with generationId fixture-existing; do not submit again.`, active: true, bypass: true, status: true, noGeneration: true },
  { id: "resume-direct-ambiguous", prompt: "继续刚才的任务。", context: `${directContext}\nUpdated submission state: submission was attempted but timed out without a generationId. Creation and billing are unknown; there is no provider confirmation of rejection.`, active: true, bypass: true, noGeneration: true },
  { id: "resume-bundled", prompt: `继续刚才的任务，用原提示词生成视频。${approved}`, context: bundledContext, active: true, activeRoute: "bundled" },
  { id: "active-file-failure", prompt: `继续之前的短剧，先恢复缺失的必读文件。${approved}`, context: partialContext, active: true, workflow: "fixture-cinema-27", failure: true },
  { id: "version-mismatch", prompt: `制作一集夜市短剧：${prompt}${approved}`, workflow: "fixture-cinema-27", versionMismatch: true },
  { id: "file-version-mismatch", prompt: `制作一集夜市短剧：${prompt}${approved}`, workflow: "fixture-cinema-27", versionMismatch: true, fileVersionMismatch: true },
  { id: "status", prompt: "只查原任务 fixture-existing 的当前状态，不生成。", status: true, noGeneration: true },
  { id: "entry-failure", prompt: `用工作流 fixture-cinema-27 生成短剧：${prompt}${approved}`, failure: true, direct: true },
  { id: "missing-id", prompt: `用工作流 fixture-missing-99 生成短剧：${prompt}${approved}`, failure: true, direct: true },
  { id: "list-failure", prompt: `制作一集夜市短剧：${prompt}${approved}`, failure: true },
  { id: "file-failure", prompt: `制作一集夜市短剧：${prompt}${approved}`, failure: true },
];
if (existsSync(join(skillRoot, "kling-ai-generate-image/SKILL.md"))) cases.push({ id: "direct-image", prompt: `/routing-test:kling-ai-generate-image 为新的夜市短剧准备一张摊主定妆图，完整提示词：雨夜摊主站在面摊前。只交付这个角色提示词，不生成。`, workflow: "fixture-cinema-27", noGeneration: true });
if (existsSync(join(skillRoot, "kling-ai-generate-video/SKILL.md"))) cases.push({ id: "direct-video", prompt: `/routing-test:kling-ai-generate-video 新的夜市短剧，完整提示词：${prompt}${approved}`, workflow: "fixture-cinema-27" });
if (existsSync(join(skillRoot, "kling-ai-generate-image/SKILL.md"))) cases.push({ id: "bypass-image", prompt: `/routing-test:kling-ai-generate-image 原提示词：${prompt} 明确保留原文并跳过本地和远端创作流程，只返回原提示词，不生成。`, bypass: true, noGeneration: true, expectedText: prompt });
if (existsSync(join(skillRoot, "kling-ai-generate-video/SKILL.md"))) cases.push({ id: "bypass-video", prompt: `/routing-test:kling-ai-generate-video ${directRequest}`, bypass: true, expectedSettings: directSettings });
const selectedCases = selected.split(",");
assert.ok(selected === "all" || selectedCases.every(id => cases.some(c => c.id === id)), `Unknown case: ${selected}`);

function runHost(c, workspace, plugin, trace) {
  const config = { mcpServers: { routing: { command: process.execPath, args: [join(root, "tests/fixtures/workflow-mcp.mjs"), trace, c.id] } } };
  const context = `This is an isolated plugin regression test. Use the Kling Skill ${entry} shipped in routing-test for Kling requests. The only provider connection is the supplied native MCP fixture, replacing the production connection for this test. The user selected this MCP channel. All generation tools are local simulations with zero media charges. Never use a CLI, network, installed user plugins or other provider connections.\n${c.context ?? ""}`;
  const settingsPath = join(homedir(), ".claude/settings.json");
  const enabled = hostName === "claude" && existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")).enabledPlugins ?? {} : {};
  const settings = { disableAllHooks: true, enabledPlugins: Object.fromEntries(Object.keys(enabled).map(name => [name, false])) };
  const claudeArgs = ["-p", "--verbose", "--output-format", "stream-json", "--no-session-persistence", "--setting-sources", "user", "--settings", JSON.stringify(settings), "--strict-mcp-config", "--mcp-config", JSON.stringify(config), "--plugin-dir", plugin, "--tools", "Read,Skill", "--allowedTools", "Read,Skill,mcp__routing__*", "--permission-mode", "dontAsk", "--append-system-prompt", context, "--max-turns", "20", c.prompt];
  const codexArgs = ["exec", "--ignore-user-config", "--ignore-rules", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--disable", "apps", "--disable", "plugins", "--json", "-c", 'model_reasoning_effort="low"', "-c", `mcp_servers.routing.command=${JSON.stringify(process.execPath)}`, "-c", `mcp_servers.routing.args=${JSON.stringify(config.mcpServers.routing.args)}`, "-c", 'mcp_servers.routing.default_tools_approval_mode="approve"', "-c", `developer_instructions=${JSON.stringify(context)}`, c.prompt.replace(/\/routing-test:([\w-]+)/g, "$$$1")];
  return new Promise((resolveResult, reject) => {
    const child = spawn(hostName, hostName === "claude" ? claudeArgs : codexArgs, {
      cwd: workspace, env: { ...process.env, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" }, stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => { child.kill("SIGTERM"); }, 150000);
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", error => { clearTimeout(timer); reject(error); });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      writeFileSync(join(workspace, "host.jsonl"), stdout);
      writeFileSync(join(workspace, "host.stderr"), stderr);
      resolveResult({ code, signal, events: stdout.trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) });
    });
  });
}
let failures = 0;
let hostLimitations = 0;
const summary = [];
for (const c of cases.filter(c => selected === "all" || selectedCases.includes(c.id))) {
  console.log(`RUN ${c.id}`);
  const workspace = join(output, c.id), plugin = join(workspace, "plugin"), trace = join(workspace, "calls.jsonl");
  mkdirSync(join(plugin, ".claude-plugin"), { recursive: true });
  mkdirSync(join(plugin, "skills"));
  for (const dir of readdirSync(skillRoot, { withFileTypes: true }).filter(dir => dir.isDirectory() && existsSync(join(skillRoot, dir.name, "SKILL.md")))) cpSync(join(skillRoot, dir.name), join(plugin, "skills", dir.name), { recursive: true });
  writeFileSync(join(plugin, ".claude-plugin/plugin.json"), JSON.stringify({ name: "routing-test", version: "1.0.0", skills: "./skills/" }));
  if (hostName === "codex") {
    mkdirSync(join(workspace, ".agents"));
    cpSync(join(plugin, "skills"), join(workspace, ".agents/skills"), { recursive: true });
    writeFileSync(join(workspace, "AGENTS.md"), "This is a read-only routing regression fixture. Use the local .agents/skills for Kling requests. Do not edit files, log work, use external services, or run any command except reading local Skill instructions and task data under user-inputs/ and results/. The parent test process owns the work journal. Provider calls must use only the routing MCP fixture.\n");
  }
  if (c.assetPaths) {
    mkdirSync(join(workspace, "user-inputs"));
    mkdirSync(join(workspace, "results"));
    writeFileSync(join(workspace, c.assetPaths[0]), prompt);
    writeFileSync(join(workspace, c.assetPaths[1]), "保持摊主与孩子身份，末尾警徽特写。不要增加人物或交付物。\n");
  }
  writeFileSync(trace, "");
  try {
    const host = await runHost(c, workspace, plugin, trace);
    assert.equal(host.code, 0, `${hostName} exited ${host.code} (${host.signal ?? "no signal"}); see host output`);
    const result = host.events.findLast(event => event.type === (hostName === "claude" ? "result" : "turn.completed"));
    assert.ok(result && !result.is_error, `Host did not finish successfully: ${result?.subtype ?? "missing result"}`);
    const records = readFileSync(trace, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
    const declarations = records.filter(record => record.method === "tools/list");
    const calls = records.filter(record => record.name);
    if (c.id === "catalog-on-page-two") {
      const first = records.findIndex(record => record.method === "tools/list" && !record.hasCatalog && record.nextCursor);
      const last = records.findIndex(record => record.method === "tools/list" && record.hasCatalog && !record.nextCursor);
      assert.ok(first >= 0, "The host did not request the first tool page");
      if (last >= 0) assert.ok(last > first && last < records.findIndex(record => record.name === "skill_catalog"), "The host used the catalog before finishing pagination");
    }
    if (c.absent) assert.ok(declarations.some(page => !page.hasCatalog && !page.cursor && !page.nextCursor), "No complete declaration observed for catalog absence");
    if (hostName === "claude") assert.ok(host.events.find(e => e.type === "system" && e.subtype === "init")?.mcp_servers.every(server => server.name === "routing"), "Unexpected MCP connection in fixture host");
    else assert.ok(host.events.filter(e => e.item?.type === "mcp_tool_call").every(e => e.item.server === "routing"), "Unexpected MCP call outside the fixture");
    const events = hostName === "claude" ? host.events : host.events.filter(e => e.type === "item.completed").map(e => ({ type: "assistant", message: { content: e.item.type === "mcp_tool_call" ? [{ type: "tool_use", name: `mcp__${e.item.server}__${e.item.tool}`, input: e.item.arguments }] : e.item.type === "command_execution" ? [{ type: "tool_use", name: "Shell", input: { command: e.item.command } }] : [] } }));
    const answer = hostName === "claude" ? result.result : host.events.filter(e => e.item?.type === "agent_message").map(e => e.item.text).join("\n");
    assert.ok(typeof answer === "string" && answer.trim(), "Host returned no text answer");
    const paginationUnavailable = c.id === "catalog-on-page-two" && !declarations.some(page => page.hasCatalog && !page.nextCursor);
    if (c.discoveryLimited || paginationUnavailable) assert.match(answer, /完整|分页|截断|complet|paginat|truncat/i, "Discovery-limited routing did not report the limitation");
    if (c.expectedText) assert.ok(answer.includes(c.expectedText), "Direct text execution changed the original prompt");
    validate(paginationUnavailable ? { ...c, discoveryLimited: true } : c, calls, events, { cwd: workspace, skillRoots: [join(plugin, "skills"), join(workspace, ".agents/skills")], skillNames: readdirSync(join(plugin, "skills")) });
    if (paginationUnavailable) hostLimitations++;
    summary.push({ case: c.id, passed: !paginationUnavailable, ...(paginationUnavailable ? { hostLimitation: "tool pagination unavailable; routing paused" } : {}), declarations, calls: calls.map(call => ({ name: call.name, id: call.args.id, path: call.args.path, ok: call.ok })) });
    console.log(paginationUnavailable ? `HOST LIMIT ${c.id}: routing paused safely` : `PASS ${c.id}`);
  } catch (error) {
    failures++;
    summary.push({ case: c.id, passed: false, error: error.message });
    console.log(`FAIL ${c.id}: ${error.message}`);
  }
  writeFileSync(join(output, "summary.json"), JSON.stringify({ host: hostName, skillRoot, entry, summary }, null, 2) + "\n");
}
console.log(`${summary.length - failures - hostLimitations}/${summary.length} passed; ${hostLimitations} host limitations; evidence: ${output}`);
process.exitCode = failures || hostLimitations ? 1 : 0;
