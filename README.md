# Kling AI for Claude Code

Build your own AI creative workflow with Kling MCP.

This plugin contains:

- a remote OAuth MCP connection to the Global endpoint `https://kling.ai/mcp/plugin`;
- three Claude Code Skills with shared connection and billing rules:

| Skill | Purpose |
| --- | --- |
| `kling-ai` | Request routing, Elements, motion-library browsing, uploads, credits, task status, and account switching |
| `kling-ai-generate-image` | Text-to-image, image-to-image, reference handling, prompt construction, and image scene guidance |
| `kling-ai-generate-video` | Text-to-video, image-to-video, omni reference, keyframes, supported audio inputs, motion control, and single-shot or multi-shot planning |

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
claude --plugin-dir /absolute/path/to/kling-ai-claude-1.2.0-public.zip
```

For a persistent installation, distribute the plugin through a trusted Claude
Code marketplace and install `kling-ai@<marketplace-name>`.

## Connect

The bundled `.mcp.json` registers one HTTP server named `kling-ai`. Open
`/mcp`, select `kling-ai`, and complete OAuth in the browser. The plugin never
asks users to paste an API key into chat.

Claude Code manages OAuth discovery, client registration, and credentials.
The plugin does not configure a custom OAuth client name or require users to
override registration metadata. If authorization fails, use the actual error
from Claude Code to diagnose the connection.

When upgrading from the old `https://klingai.com/mcp` connection, finish any
outstanding task checks in the original region, disconnect the old OAuth
session, update/reload the plugin, and authorize your Global account through
`/mcp`. Regional accounts, credits, and task IDs must not be assumed to carry
over. Keep only one active Kling connection.

## Use

Ask Claude naturally, for example:

- Draw a red panda in a vintage spacesuit floating by a space station window,
  Earth’s blue glow lighting its face, richly detailed, cinematic look.
- Create a 5-second cinematic video: a mecha warrior crashes down from the sky,
  shockwave blasting rocks and dust, camera rapidly pushing in with raw power.
- Create a 15-second sneaker marketing short: open with a street hook, cut to
  product close-ups and on-foot action within three seconds, end on a shoe
  detail close-up.
- Show my motion library with names and durations, without generating a video.
- Save these product reference images as an Element named "Blue sneaker".
- List my Elements, then show the details of "Blue sneaker".
- Change only the description of "Blue sneaker", keeping its existing images.
- Use this subject image with a motion from my library; show the final settings
  before generating.
- Use the latest video model available to my account for a cinematic shot.
- Combine these image and video references, preserving the source audio if the
  selected model supports it.

Element workflows cover creation, listing, details, updates, deletion, and
reuse with compatible models. Motion-library management is read-only; the
Skill does not invent motion creation or deletion tools. Motion control needs
a subject image and exactly one motion source. Available models, arguments,
and resource limits always come from the live MCP tools.

Video discovery includes `omni_ref_video` when available, even for text-only
requests. Models are selected from the current account's `who_am_i` response;
the plugin does not hardcode rollout model names or assume that a new tool
grants model access. Keyframes, image/video/Element/audio references, combined
reference limits, and sound controls follow the selected model's live rules.
When no applicable newer model is returned, ordinary requests retain their
existing compatible entry point and live default. An explicitly requested
unavailable model is reported without silently substituting another model.

The Skills require explicit approval of the final settings before a
credit-consuming generation and submit each approved intent at most once.
Library queries and uploads do not authorize generation. They discover the
live tool schemas at runtime and let the host render any MCP App resource
returned by the remote server.

Generation sends the prompt, selected settings, and reference media URLs or
Element IDs to Kling. Local reference files are uploaded only when needed
through the upload flow returned by Kling. Generation and asset storage run
on the remote service; account and task queries also contact Kling.

Quality defaults follow the reference plugin: live-supported `2k` images and
`1080p` video for normal delivery, with higher quality for commercial work and
lower-cost modes when requested. Final settings are shown before submission.

## Validate

```bash
claude plugin validate . --strict
claude plugin validate .claude-plugin/plugin.json --strict
npm run check
npm test
```

The repository-local check validates metadata, the remote connection, Skill
identities, bundled links, and exclusion of rollout-only names from public
documentation. It does not submit paid generation tasks or prove account
access to a model; live routing and generation still require an authorized
Claude Code connection.

For Claude's component validation, inspect the per-file `contents` in
`claude plugin validate skills --strict --json`. An empty `contents` array
does not establish that the Skills were checked. Local validation also does
not replace the developer portal's directory checks or security review; see
the [official pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist).

The public ZIP must contain only the plugin manifest, remote MCP declaration,
Skill files, README, and LICENSE. It must not contain `mcp-app`, a local server,
credentials, or generated media.

## Claude Desktop and Cowork

Claude supports plugins in chat, Claude Desktop, and Cowork, with component
support varying by surface; see [Use plugins in Claude](https://support.claude.com/en/articles/13837440-use-plugins-in-claude).
This package's instructions target Claude Code. Its authentication flow,
uploads, and result presentation have not been validated on the other
surfaces. Do not assume Claude Code commands such as `/mcp` apply there; use
the target host's native plugin and connector controls.
