# Remote tool workflows

## Generation

1. Use the plugin's single `kling-ai` connection at `https://kling.ai/mcp/plugin` and follow [capability discovery](capability-discovery.md), including all tool-list pages and relevant new entry points.
2. Create or reuse the objective's UUIDv7 `taskTraceId`, reuse the successful `who_am_i` response for this preparation, and apply [model parameters](model-parameters.md) to the selected tool/model pair. Video selection follows [video routing](../../kling-ai-generate-video/references/model-routing.md), including `omni_ref_video` when available. Refresh capability data when invalidated, not just because another reference was loaded.
3. For Elements, motion-library selections, or local media, follow [asset workflows](asset-workflows.md). A library operation does not authorize generation. Do not silently fall back to text-only generation if a required reference is unavailable.
4. Show the final mode, model, prompt summary, resolution, duration when applicable, aspect ratio, output count, and reference roles. Include live-required billing disclosures, including per-second billing and input video duration when applicable. Describe shot controls only as declared by the model, without inferring the actual number of cuts. Obtain explicit approval under the core Skill's billing rule.
5. Call the selected tool once using its live schema, normally `{model, arguments[], inputs[], rationale, taskTraceId}`. Preserve `generationId`.
6. If the generation MCP App renders, let it query and refresh internally. If no App renders, use headless `query_tasks` at the provider-permitted interval until terminal, cancelled, or the turn cannot continue.
7. A successful submission means accepted, not finished. Confirm terminal success and primary media before reporting completion. Without a rendered App, return the text fallback, task number, and at most one primary media link.

## Read-only operations

- Credits: call `query_membership_and_credits` once.
- Task status: call `query_tasks` once with a known `generationId`; do not start long-running polling for a direct status request.
- Model capabilities: call `who_am_i` without creating a task.
- Motion library: call `motion_library_list`; do not call `motion_control` merely to browse.
- Subject library: use `element_list` and `element_get` to resolve real subjects and resource types.

## State changes

- Create or update an Element only as requested, following the complete-resource rules in [asset workflows](asset-workflows.md).
- Delete an Element only when the user explicitly identifies the deletion target. A cover replacement that requires delete-and-recreate needs explicit authorization for the ID change.
- Call `logout` or switch accounts only when explicitly requested. Re-enter native Claude Code OAuth through `/mcp` and stop other Kling calls until authorization completes.

Never retry a generation automatically. If no `generationId` was received, report unknown creation state; do not invent task-history or trace-ID lookup capabilities.
