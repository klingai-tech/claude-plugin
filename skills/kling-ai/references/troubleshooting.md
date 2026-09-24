# Claude Code troubleshooting

## MCP tools are missing

Use `/mcp` to verify that the plugin's `kling-ai` server is enabled and points to `https://kling.ai/mcp/plugin`. After changing plugin files, run `/reload-plugins`; if the tool definitions remain stale, restart the Claude Code session and check its MCP diagnostics. Do not add a duplicate server or use an API key as a workaround.

## Endpoint migration and authorization

This release uses the Global endpoint `https://kling.ai/mcp/plugin`. The previous `https://klingai.com/mcp` endpoint belongs to a different region. Before updating an existing connection, retain any outstanding task numbers and finish their status checks through the original connection. Disconnect the old host-managed OAuth session, update the plugin, then use `/mcp` to authorize the Global account. Never transfer credentials between hosts or assume that regional task history and credits are shared.

For an authorization failure, use `/mcp`, select the plugin's Kling server, and complete native OAuth. If sign-out or account switching was explicitly requested, call the live `logout` tool as documented and reauthorize before other Kling calls. Do not paste tokens, construct OAuth URLs manually, or add an `oauth_resource` override. `/reload-plugins` reloads plugin files; it does not refresh OAuth credentials.

## Upload fails

- Read the live `file_upload` schema and [asset workflow](asset-workflows.md).
- A ticket is only the first step. Complete the multipart upload with `ticket` and binary `file`, then use the confirmed media URL.
- Reuse the objective's `taskTraceId` where accepted. Never send local paths or expired signed URLs as remote media inputs.
- If upload is unavailable or fails, stop before dependent Element writes or generation. Do not silently switch to text-only generation or loop on upload requests.

## Element or motion cannot be used

- Resolve ambiguous names before selecting an ID. Use `element_get` to inspect the resource type and access before reuse or updates.
- Use Elements only with explicitly compatible live models; text-to-image and text-to-video do not accept them. Preserve required image inputs and bind the ID in both prompt and structured arguments.
- Keep the existing cover and unmodified secondary images when updating an image Element. Do not change its resource type or delete-and-recreate without explicit authorization.
- Motion control requires a subject image and exactly one source: `motionId` or a video input. A library preview URL is not a motion ID. Validate source duration and model arguments; do not invent a `duration` parameter.
- An empty motion library is a valid result. The current tool surface has no motion create, update, or delete operation.

## Task is still running or the result App does not render

If the generation MCP App is mounted, let it refresh internally. Otherwise use headless `query_tasks` at the provider-permitted interval until terminal, cancellation, or the turn cannot continue. A direct status request queries once. Keep the task number for later follow-up.

A rendering problem is not a generation failure. Preserve the tool result and use its text fallback and at most one primary result link. Do not register a local MCP server, embed duplicate media, or claim that an unmounted App was displayed. Report success only after terminal success with usable primary media; a cover image is not the video.

## Submission fails or times out

Do not retry generation. If a `generationId` is known, query it once. Otherwise report that creation and billing state are unknown: the current MCP cannot list account history or find a task by `taskTraceId`. Any new generation needs fresh explicit authorization.

For a provider failure, return the provider message and preserve task IDs. For unsupported arguments, refresh the live schema, revise the rejected settings, and obtain confirmation before any new generation.

## Result link expired

Query the original `generationId` for current outputs immediately before reuse. Do not treat signed URLs as permanent asset identifiers or log them. If the task cannot be queried in the current region, explain the limitation rather than creating a replacement task.
