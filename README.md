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

Ask Claude in natural language. You can name the model you want to use.

### Suggested prompts

**English**

- Use Kling to generate a series of three images in one request. Show the same red panda in a vintage spacesuit exiting a space station, drifting past a porthole, and turning to look at the blue Earth.
- Use Kling 4.0 to generate a 20‑second cinematic video: a mech warrior slams down from height onto the ground, sending out a shockwave that instantly blasts apart rubble and dust, with the camera rapidly pushing in for a powerful impact.
- Use Kling 4.0 Flash to turn my sneaker product photo into a 20-second, 720p video. Start from the photo, slowly orbit the shoe, and end on a close-up of the upper.
- Use Kling AI to browse the motion library and preview saved motions; after I select one, apply it to my subject image with an available motion-control model to generate a video.
- Use Kling AI to save the front and side views of my character as my first reusable Element, named “Xiaobai”, to help keep the character consistent in later creations.

**简体中文**

- 用可灵一次生成 3 张连续组图。让同一只身穿复古宇航服的小熊猫依次从空间站出舱、掠过舷窗、转身望向蓝色地球
- 使用可灵 4.0 生成一段 20 秒电影感视频：机甲战士从高空重砸地面，冲击波瞬间震开碎石与尘雾，镜头快速推近，充满力量感
- 使用可灵 4.0 Flash，把我提供的运动鞋商品图作为首帧，生成一段 20 秒、720p 的视频，镜头缓慢绕过鞋身，最后停在鞋面细节上
- 使用可灵AI查看动作库，预览已保存的动作；选定后，用可用的动作控制模型将该动作应用到我提供的主体图片生成视频
- 使用可灵AI将我提供的角色正面图和侧面图保存为第一个可复用主体，命名为“小白”，方便后续创作时保持角色一致

### Image and video models

For image generation and reference-guided editing, the plugin prefers the
selected tool's available default model when it fits the request. A continuous
image series requires a model that supports both series generation and the
requested number of images in one task.

| Video model | Generation modes | Output |
| --- | --- | --- |
| Kling 4.0 | Text-to-video, image-to-video with first, last, and intermediate keyframes, and Omni Reference with images, videos, audio, and Elements | 3–30 seconds at 720p, with 1080p available to eligible accounts |
| Kling 4.0 Flash | Text-to-video, image-to-video from a single first-frame image, and Omni Reference with images, videos, and Elements | 3–20 seconds at 720p |

Both Omni Reference models support smart shot splitting. Where the selected
model exposes the audio controls, choose either synchronized sound generation
or retention of the reference video's original sound. A separate audio
reference requires a declared audio input, such as on Kling 4.0 Omni Reference.

Element workflows cover creation, listing, details, updates, deletion, and
reuse with compatible models. Motion-library management is read-only; the
Skill does not invent motion creation or deletion tools. Motion control needs
a subject image and exactly one motion source. Available models, arguments,
and resource limits always come from the live MCP tools.

Video discovery includes `omni_ref_video` when available, even for text-only
requests. The plugin prefers a compatible Kling 4.0 Omni Reference model when
the user leaves model selection open. Kling 4.0 Flash is preferred when it fits
the request and the user prioritizes speed or credit savings. Model access,
identifiers, output settings, and reference limits come from the current
account's `who_am_i` response. If no model in the Kling 4.0 family fits, the
plugin can use a compatible live default when the user allows it. An explicitly
requested unavailable model is reported without silently substituting another model.

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

If credits are insufficient, recharge the same account through
the official Kling site, then ask Claude to continue in the same conversation.
Claude checks any known task number first and rechecks the balance before a
new submission. If a status refresh fails, Claude reports the task number
and the last confirmed status when available.

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
