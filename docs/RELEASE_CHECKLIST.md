# Claude Code MCP + Skill submission checklist

## Package shape

- [ ] `.claude-plugin/plugin.json` has the immutable slug `kling-ai`, current
      version, description, author, homepage, license, `skills`, and
      `mcpServers`.
- [ ] `.mcp.json` registers exactly one HTTP server named `kling-ai` at
      `https://klingai.com/mcp`.
- [ ] `skills/kling-ai/SKILL.md` has valid `name` and trigger-focused
      `description` frontmatter.
- [ ] The archive contains README and LICENSE.
- [ ] The archive contains no `commands/`, local MCP server, `mcp-app`, API
      key, token, cookie, generated media, or development dependency.

## Behavior

- [ ] Claude discovers the Skill from natural image, video, upload, status,
      and credit requests.
- [ ] OAuth uses Claude's native MCP connection flow and identifies dynamic
      client registration with `client_name: "Plugin-Claude"`.
- [ ] A generation requires final billable-setting confirmation and one
      approved intent creates at most one task.
- [ ] The exact `generationId` and `taskTraceId`, when returned, are preserved.
- [ ] MCP App resources returned by the remote server are left to the host to
      render; the Skill does not duplicate media.
- [ ] Authorization refusal, expired authorization, provider failure, and an
      ambiguous submission response do not trigger automatic resubmission.

## Validation

- [ ] `claude plugin validate claude/kling-ai --strict` passes.
- [ ] `node scripts/verify-host-parity.mjs` passes.
- [ ] `npm run check --prefix claude/kling-ai` passes.
- [ ] `npm test --prefix claude/kling-ai` passes.
- [ ] The packaged ZIP is inspected and contains only the approved files.
- [ ] A clean Claude Code profile can install, connect, discover the Skill,
      make a read-only MCP call, and reach the pre-generation confirmation
      step without submitting a paid task.

## Directory submission metadata

- [ ] Marketplace name remains `kling-ai`.
- [ ] Category is selected from the directory's supported values; use
      `development` unless the reviewer requests a different category.
- [ ] Description, author, homepage, and source location are supplied in the
      plugin directory submission form.
- [ ] Public marketplace availability is not claimed before review and listing.
