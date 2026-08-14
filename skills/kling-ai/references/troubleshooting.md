# Troubleshooting

## A remote result card does not open

Claude Code supports the MCP tool call even when its current surface does not
mount an MCP App iframe. Treat successful tool content as the result and give
one primary output link when available. Do not register a second local MCP
server, copy the remote App into this plugin, or claim that an unmounted card
was displayed.

If the remote tool itself returns an App resource that Claude Code cannot
render, preserve the tool result and report the host rendering limitation. For
Claude Desktop or Cowork, add the same remote endpoint through the native
connector flow; this Claude Code plugin bundle is not installed there.

## MCP tools are missing after installation

First identify the host. In claude.ai or Claude Desktop, add
`https://klingai.com/mcp` under **Settings → Connectors**, complete OAuth, and
enable the connector from **Search and tools**. `/reload-plugins` and local
plugin files do not apply there. In Claude Code, reload the host's
plugins/extensions and confirm that the `kling-ai` MCP server is enabled. If
the tools still do not appear, restart the host and check its MCP diagnostics.
Do not ask for an API key as a workaround.

## Not authorized or not linked

In claude.ai or Claude Desktop, open **Settings → Connectors**, select the
Kling connector, click **Connect**, and complete OAuth. In Claude Code, run
`/mcp`, select `kling-ai`, and complete the browser OAuth flow. The host stores
credentials securely and refreshes access tokens automatically. Do not paste a
key or token into chat, manually construct an OAuth URL, or add an explicit
`oauth_resource` override.

Run `/reload-plugins` only after changing plugin files or reinstalling the
plugin. It reloads the plugin and its MCP server; it is not an OAuth refresh
operation.

## Upload or image-to-video fails

- Confirm `file_upload` returned a Kling URL.
- Reuse the same UUID v7 `taskTraceId` for upload and generation.
- Use the input name declared by the selected live model, commonly
  `first_image` for one first frame.
- Keep every `arguments[].value` a string.

## Task is still running

Ask the Agent to query the task once with its `generationId`. Do not poll in a
loop; the task keeps running on Kling's side even after the host session ends.

## Generation fails

Return the provider's failure message and preserve the IDs for support. Do
not automatically create a replacement task because that may consume credits
again.

## Submission timed out and billing is unknown

Do not retry the generation call. First query existing tasks using the
available `taskTraceId`, `generationId`, or provider task-list filters. If the
provider cannot prove whether a task was created, tell the user the billing
state is unknown and request a deliberate decision before any new submission.

## Result link expired

Signed output URLs may be temporary. Query the preserved `generationId` again
to obtain current outputs. Do not log or treat a signed URL as a permanent
asset identifier.
