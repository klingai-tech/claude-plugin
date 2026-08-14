# Kling AI for Claude Code

Build your own AI creative workflow with Kling MCP.

This submission contains exactly two runtime capabilities:

- a remote OAuth MCP connection to `https://klingai.com/mcp`;
- one Claude Code Skill for image generation, video generation, uploads, task
  status, and credit checks.

It does not bundle a local MCP server, MCP App, command, hook, agent, or API
key. Generation runs on the remote Kling service.

## Install for local review

Load the plugin directory for one Claude Code session:

```bash
claude --plugin-dir /absolute/path/to/kling-ai
```

Claude Code versions that support ZIP plugin directories can load the release
archive directly:

```bash
claude --plugin-dir /absolute/path/to/kling-ai-claude-1.0.0-public.zip
```

For a persistent installation, distribute the plugin through a trusted Claude
Code marketplace and install `kling-ai@<marketplace-name>`.

## Connect

The bundled `.mcp.json` registers one HTTP server named `kling-ai`. Open
`/mcp`, select `kling-ai`, and complete OAuth in the browser. The plugin never
asks users to paste an API key into chat.

The OAuth dynamic client registration must identify Claude Code with
`client_name: "Plugin-Claude"`. This is OAuth metadata, not an MCP tool
argument or URL parameter.

## Use

Ask Claude naturally, for example:

- Draw a red panda in a vintage spacesuit floating by a space station window,
  Earth’s blue glow lighting its face, richly detailed, cinematic look.
- Create a 5-second cinematic video: a mecha warrior crashes down from the sky,
  shockwave blasting rocks and dust, camera rapidly pushing in with raw power.
- Create a 15-second sneaker marketing short: open with a street hook, cut to
  product close-ups and on-foot action within three seconds, end on a shoe
  detail close-up.

The Skill requires confirmation immediately before a credit-consuming
generation and submits each approved intent at most once. It discovers the
live tool schemas at runtime and lets the host render any MCP App resource
returned by the remote server.

## Validate

```bash
claude plugin validate . --strict
npm run check
npm test
```

The public ZIP must contain only the plugin manifest, remote MCP declaration,
Skill files, README, and LICENSE. It must not contain `mcp-app`, a local server,
credentials, or generated media.

## Claude Desktop and Cowork

This package targets Claude Code. Claude Desktop and Cowork do not install
Claude Code plugin bundles; connect the same remote MCP through their native
custom connector flow instead.
