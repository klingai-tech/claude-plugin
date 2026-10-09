# Claude Code MCP + Skill submission checklist

## Package shape

- [ ] `.claude-plugin/plugin.json` has the immutable slug `kling-ai`, current
      version, description, author, homepage, license, `skills`, and
      `mcpServers`.
- [ ] `.mcp.json` registers exactly one HTTP server named `kling-ai` at
      `https://kling.ai/mcp/plugin` (Global).
- [ ] `kling-ai`, `kling-ai-generate-image`, and `kling-ai-generate-video`
      each have valid `name` and trigger-focused `description` frontmatter.
- [ ] The main Skill routes creation to the matching generation Skill; all
      cross-Skill links and bundled reference documents resolve.
- [ ] The archive contains README and LICENSE.
- [ ] The archive contains no `commands/`, local MCP server, `mcp-app`, API
      key, token, cookie, generated media, or development dependency.

## Behavior

- [ ] Complete tool discovery includes pagination; video capability queries
      include `omni_ref_video` when present, even for pure-text requests.
- [ ] New model selection is account-scoped; a new tool with only existing
      models does not force migration. User-specified unavailable models are
      not silently replaced, and discovery failures stop selection.
- [ ] Keyframes, reference inputs, Element types, conditional combined caps,
      and sound exclusivity follow the selected tool/model pair's live rules.
- [ ] Generation without requested sound or multiple shots does not inherit
      content-expanding model defaults.
- [ ] Claude discovers the Skill from image, video, motion-library, motion
      control, Element, upload, status, credit, and account-switching requests.
- [ ] Library browsing creates no generation; motion control requires a subject
      image and exactly one motion source, with live model constraints.
- [ ] Element reuse resolves real IDs with `element_get`, validates resource
      type/model compatibility, and supplies prompt and structured bindings.
- [ ] Element updates preserve unspecified fields and resource types; deletion
      or delete-and-recreate follows an explicit request.
- [ ] Uploads complete the ticket and multipart steps before dependent writes.
- [ ] Upgrades from the old regional endpoint disconnect old OAuth before
      authorizing the Global account; tasks/credits are not assumed to transfer.
- [ ] OAuth uses Claude's native MCP connection flow; client registration is
      host-managed and no unsupported custom client-name override blocks it.
- [ ] A generation requires final billable-setting confirmation and one
      approved intent creates at most one task.
- [ ] The exact `generationId` and `taskTraceId`, when returned, are preserved.
- [ ] A lost submission without `generationId` reports unknown state and does
      not attempt unsupported account-history or `taskTraceId` lookup.
- [ ] MCP App resources returned by the remote server are left to the host to
      render; the Skill does not duplicate media.
- [ ] Authorization refusal, expired authorization, provider failure, and an
      ambiguous submission response do not trigger automatic resubmission.

## Validation

- [ ] `claude plugin validate . --strict` passes.
- [ ] `claude plugin validate .claude-plugin/plugin.json --strict` passes.
- [ ] Component validation reports individual Skill files without errors;
      an empty `contents` array is not evidence of Skill validation.
- [ ] `npm run check` passes from this repository or an isolated checkout.
- [ ] `npm test` passes.
- [ ] The packaged ZIP is inspected and contains only the approved files.
- [ ] A clean Claude Code profile can install, connect, discover the Skill,
      make a read-only MCP call, and reach the pre-generation confirmation
      step without submitting a paid task.

## Directory submission metadata

- [ ] Plugin name remains `kling-ai`; the repository marketplace name remains
      `klingai`, matching the existing manifests.
- [ ] Any category requested by the submission portal matches the plugin's
      purpose and the portal's available values.
- [ ] Description, author, homepage, and source location are supplied in the
      plugin directory submission form.
- [ ] Public marketplace availability is not claimed before review and listing.
- [ ] README describes remote prompt/media processing and accurately limits
      compatibility claims to the surfaces actually tested.
- [ ] The developer portal's Validate has no blocking findings for the exact
      submitted commit, following the [official checklist](https://claude.com/docs/plugins/pre-submission-checklist).
- [ ] Confirm the existing Kling remote MCP connector submission and its URL;
      if absent, submit the service separately as required by the
      [directory publishing guide](https://claude.com/docs/directory/publish).
- [ ] Complete the portal's data-handling questions and security review using
      verified service information; do not invent retention or privacy claims.
