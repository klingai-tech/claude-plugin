// Isolated stdio fixture: no provider client, credentials, uploads, or network.
import { appendFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

const [trace, scenario] = process.argv.slice(2);
export const discoveryLimits = {
  "tools-search-miss": "The host's tool search returned no hits for skill_catalog; no complete declarations were obtained.",
  "tools-truncated": "The host's tool search result was truncated; no complete declarations were obtained.",
  "tools-incomplete": "The host supplied incomplete tool declarations; remaining declarations are unavailable.",
  "tools-discovery-failure": "The host failed to retrieve the complete tool declarations.",
};
const generations = ["text_to_image", "image_to_image", "text_to_video", "image_to_video", "omni_ref_video", "motion_control"];
const schema = (properties = {}) => ({ type: "object", properties, additionalProperties: true });
const string = { type: "string" };
const tools = [
  { name: "who_am_i", description: "Check this fixture connection and available models before generation.", inputSchema: schema({ tools: { type: "array", items: string } }) },
  { name: "skill_catalog", description: "List current creative workflows, read an entry by exact id, or read a listed package file with id and path.", inputSchema: schema({ id: string, path: string }) },
  { name: "query_membership_and_credits", description: "Return fixture credits.", inputSchema: schema() },
  { name: "query_tasks", description: "Query an existing fixture generationId; never create a generation.", inputSchema: schema({ generationId: string }) },
  ...generations.map(name => ({ name, description: "Submit a simulated generation. No media is created and no credits are charged.", inputSchema: schema({ model: string, arguments: { type: "array", items: schema({ name: string, value: string }) }, inputs: { type: "array", items: schema() } }) })),
];
const workflows = [
  { id: "fixture-cinema-27", name: "夜市短剧制作", description: "制作短剧、分集或短剧所需的人物定妆图，支持已有完整提示词。", version: "1.0.0", tools: [] },
  { id: "fixture-brand-83", name: "品牌宣传片", description: "制作品牌宣传片与产品品牌视频。", version: "1.0.0", tools: ["text_to_video"] },
];
export const packageGuide = `You own this creative objective. Follow only this package and its references, within the user's requested scope. Do not invoke bundled generation Skills or their local references. Do not add character sheets or extra deliverables. Read the required file references/kling-ai/SKILL.md with skill_catalog using this package's exact ID. If this is prompt-only, return the requested text and stop. For authorized video generation, query fixture capabilities and current credits, then call text_to_video exactly once using fixture-video, the user's prompt, duration 5 and resolution 720p. Preserve these package settings; do not add bundled quality defaults. Return the simulated task number.`;
export const executionGuide = `This is the selected package's execution guide, not a bundled Skill. Continue the active workflow without rediscovering the catalog or invoking local generation Skills. For an already authorized task, check fixture capabilities and credits, then call text_to_video once with model fixture-video, duration 5 and resolution 720p. Prompt-only work ends with text.`;

function call(name, args) {
  if (name === "skill_catalog") {
    if (scenario === "list-failure" && !args.id) throw new Error("Fixture catalog unavailable");
    if (!args.id) return { workflows: ["ordinary", "unmatched-text"].includes(scenario) ? [] : workflows };
    if (scenario === "entry-failure") throw new Error("Fixture entry unavailable");
    const selected = workflows.find(w => w.id === args.id);
    if (!selected) throw new Error("Unknown fixture workflow ID");
    const version = (!args.path && scenario === "version-mismatch") ||
      (args.path && scenario === "file-version-mismatch") ? "2.0.0" : selected.version;
    const workflow = { ...selected, version };
    const files = ["SKILL.md", "references/kling-ai/SKILL.md"];
    if (args.path) {
      if (["file-failure", "active-file-failure"].includes(scenario)) throw new Error("Fixture required file unavailable");
      if (args.path !== "references/kling-ai/SKILL.md") throw new Error("Unknown fixture package path");
      return { workflow, path: args.path, content: executionGuide, files };
    }
    return { workflow, path: "SKILL.md", content: packageGuide, files };
  }
  if (name === "who_am_i") return { availableModels: Object.fromEntries(generations.map(tool => [tool, { defaultModel: "fixture-video", models: [{ model: "fixture-video", name: "Fixture video", arguments: [{ name: "prompt", required: true }, { name: "duration", required: true, enum: ["5"] }, { name: "resolution", required: true, enum: ["720p", "1080p"] }], inputs: [] }] }])) };
  if (name === "query_membership_and_credits") return { credits: 100, availableCredits: 100 };
  if (name === "query_tasks") return { generationId: args.generationId, status: "SUCCEED", works: [{ type: "video", status: "SUCCEED", url: "https://example.invalid/fixture.mp4" }] };
  if (generations.includes(name)) return { generationId: "fixture-generation", status: "SUCCEED", works: [{ type: name.includes("image") && !name.includes("video") ? "image" : "video", status: "SUCCEED", url: "https://example.invalid/fixture.mp4" }], creditsConsumed: 0 };
  throw new Error("Unknown fixture tool");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && trace) createInterface({ input: process.stdin }).on("line", line => {
  const request = JSON.parse(line);
  if (request.id === undefined) return;
  let result;
  if (request.method === "initialize") result = { protocolVersion: request.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "routing-fixture", version: "1.0.0" } };
  else if (request.method === "tools/list") {
    const paged = scenario === "catalog-on-page-two";
    const cursor = request.params?.cursor;
    const hideCatalog = paged || ["catalog-absent", "absent-text"].includes(scenario) || Object.hasOwn(discoveryLimits, scenario);
    result = paged && cursor === "catalog-page"
      ? { tools: tools.filter(tool => tool.name === "skill_catalog") }
      : { tools: hideCatalog ? tools.filter(tool => tool.name !== "skill_catalog") : tools, ...(paged ? { nextCursor: "catalog-page" } : {}) };
    appendFileSync(trace, JSON.stringify({ method: "tools/list", cursor, nextCursor: result.nextCursor, hasCatalog: result.tools.some(tool => tool.name === "skill_catalog") }) + "\n");
  }
  else if (request.method === "tools/call") {
    const { name, arguments: args = {} } = request.params;
    try {
      const value = call(name, args);
      appendFileSync(trace, JSON.stringify({ name, args, ok: true }) + "\n");
      result = { content: [{ type: "text", text: JSON.stringify(value) }] };
    } catch (error) {
      appendFileSync(trace, JSON.stringify({ name, args, ok: false }) + "\n");
      result = { isError: true, content: [{ type: "text", text: error.message }] };
    }
  } else if (request.method === "ping") result = {};
  else return process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, error: { code: -32601, message: "Method not found" } }) + "\n");
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\n");
});
