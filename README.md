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

## Install in Claude Code

Claude Code 2.1.292 or later can install from this repository's marketplace in one command.

```bash
claude plugin install kling-ai --marketplace klingai-tech/claude-plugin
```

You can also add the marketplace and install the plugin in two steps.

```bash
claude plugin marketplace add klingai-tech/claude-plugin
claude plugin install kling-ai@klingai
```

### Install for local review

Load a checkout for one Claude Code session.

```bash
git clone https://github.com/klingai-tech/claude-plugin.git
cd claude-plugin
claude --plugin-dir "$PWD"
```

If you have a plugin ZIP and your Claude Code version supports ZIP plugin
directories, pass the archive path to `claude --plugin-dir`.

## Connect

After installation, start Claude Code, open `/mcp`, select `kling-ai`, and
authorize your Global Kling account in the browser. The bundled `.mcp.json`
registers this remote server. The plugin never asks users to paste an API key
into chat.

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
- Use V4 for a cinematic video shot.
- Combine these image and video references, preserving the source audio if the
  selected model supports it.

Element workflows cover creation, listing, details, updates, deletion, and
reuse with compatible models. Motion-library management is read-only; the
Skill does not invent motion creation or deletion tools. Motion control needs
a subject image and exactly one motion source. Available models, arguments,
and resource limits always come from the live MCP tools.

Video discovery includes `omni_ref_video` when available, even for text-only
requests. Models are selected from the current account's `who_am_i` response;
V4 is generally available, and the plugin recommends V4 for video generation. V4 Flash is preferred when speed or credit savings are requested.
Model identifiers and parameters come from live discovery; a tool alone does
not establish model access. Keyframes, image/video/Element/audio references, combined
reference limits, and sound controls follow the selected model's live rules.
When no compatible V4 model is returned, ordinary requests retain their
existing compatible entry point and live default. An explicitly requested
unavailable model is reported without silently substituting another model.

The Skills require explicit approval of the final settings before a
credit-consuming generation and submit each approved intent at most once.
They check the connected account's balance immediately before submission.

Library queries and uploads do not authorize generation. They discover the
live tool schemas at runtime and let the host render any MCP App resource
returned by the remote server.

The [skills.sh Snyk audit](https://www.skills.sh/klingai-tech/claude-plugin/kling-ai/security/snyk)
flags credit-consuming generation as W009. Balance lookup and approved
generation run through Kling's OAuth MCP. Manage credit purchases directly on
the [Global Kling website](https://kling.ai/).

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
identities and bundled links, including support for V4 names in public
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
