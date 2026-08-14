# Remote tool workflow

1. Discover the live tools and schemas from remote `kling-ai` at `https://klingai.com/mcp`.
2. For attached media, call the remote upload tool and pass its returned reference to the generation request.
3. Show the final billable settings and obtain explicit confirmation.
4. Call the selected remote generation tool exactly once and preserve its `generationId`.
5. Use remote `query_tasks` for status. If the remote result includes an MCP App resource, let the host render it; otherwise present the returned content and one primary output link.

The plugin has no local MCP server or mock runtime. Never retry a generation automatically.
