---
name: kling-ai
description: Create and manage Kling AI images, videos, motion control, and reusable subjects (Elements) through the OAuth-protected remote MCP in Claude Code. Use for generation, motion-library browsing, Element management and reuse, uploads, credit checks, task status, and account switching.
license: MIT
---

# Kling AI for Claude Code

Use only the remote Global MCP configured by this plugin: `https://kling.ai/mcp/plugin`. `.mcp.json` is the connection source of truth. Do not switch regions, register a second Kling MCP, or start or depend on a local MCP server.

## Request routing

- New images or videos: use `text_to_image` or `text_to_video` when text defines the result; use `image_to_image` or `image_to_video` when media controls identity, product, composition, or reference frames.
- Motion library: browse with `motion_library_list`. Motion transfer uses `motion_control` with a subject image and exactly one motion source.
- Subject library / Elements: use `element_list`, `element_get`, `element_create`, `element_update`, or `element_delete` for the requested operation. Resolve real IDs before reuse.
- Account and credits: use `query_membership_and_credits`; model capabilities come from `who_am_i`.
- Existing tasks: use `query_tasks` with a known `generationId`. A status or library request never creates a generation.
- Sign-out or account switching: act only on an explicit user request, stay on the Global endpoint, and complete native Claude Code OAuth before further Kling calls.

Call only tools present in the live tool list. An attachment alone does not determine its role; clarify only when first frame, tail frame, identity/product reference, editable source, motion source, or style reference would materially change the request.

Read [asset workflows](references/asset-workflows.md) for Elements, the motion library, or uploads. Before generation, read [tool workflows](references/tool-workflows.md) and the [MCP contract](references/mcp-contract.md). Use [prompt examples](references/prompt-examples.md) for creative direction and [troubleshooting](references/troubleshooting.md) after a failure.

## Connection and task identity

- Use OAuth through Claude Code's native MCP connection flow (`/mcp`, then the plugin's `kling-ai` server). Never request an API key, token, cookie, authorization header, or credential file. Never log private account fields, upload tickets, or signed URLs.
- OAuth dynamic client registration uses `client_name: "Plugin-Claude"`. This is OAuth metadata, not a tool argument, URL parameter, or secret. If the host cannot inject it, stop before authorization and report the limitation.
- Create one UUIDv7 `taskTraceId` for each unrelated new objective. Reuse it across discovery, upload, generation, and querying for that objective wherever the live tool accepts it.
- Preserve exact returned IDs. Present `generationId` as the task number; expose `taskTraceId` only when troubleshooting requires it.

## Billing and single submission

- Image, video, and motion generation consume credits. Call `who_am_i` before submission and select only live-supported models, arguments, enums, defaults, and media inputs. Refresh stale tool definitions before proceeding.
- Show the final workflow, model, prompt summary, duration/resolution, aspect ratio, output count, and reference roles. Obtain explicit confirmation immediately before submission unless the current user message already authorizes immediate submission with those final settings. An upload, library operation, or credit check is not generation approval.
- Submit at most once per approved intent. Never automatically retry or silently change models after a failure, timeout, ambiguous response, or rendering problem.
- Do not save an Element automatically during ordinary generation. Element writes and deletion must follow the user's explicit request as described in [asset workflows](references/asset-workflows.md).

## Generation and results

1. Resolve reference roles, Elements, and motion sources; prepare local media before submission. Use the returned provider references exactly as the selected live schema requires.
2. Confirm the final billable settings, then call the chosen generation tool once. A multi-shot plan remains one task unless the user approves separate tasks.
3. Once `generationId` is known, use only `query_tasks` for follow-up. If the submission response is lost before an ID is known, stop and report that creation/billing state is unknown. The current MCP cannot list account history or recover a task by `taskTraceId`.
4. If Claude Code renders the generation MCP App, let that App own task refresh. Do not poll the same task from the model or add duplicate media, thumbnails, or download links.
5. If no App renders, query at the provider-permitted interval until terminal, cancelled, or the turn cannot continue. Report the actual state and task number, with the tool's text fallback and at most one primary result link. Do not add Markdown image/video embeds or claim an unmounted App was displayed.
6. For an explicit status request, query once and report the current state; do not start a long polling loop.
7. Claim completion only after terminal success with usable primary media. If work-level status exists it must also be successful; a video cover alone is not a completed video.

## Quality defaults

Apply only when the user has not specified another choice and the live model supports it:

- Prefer full-quality models. Use Turbo, fast, or low-cost modes when the user prioritizes drafts, speed, or credit savings.
- Images: prefer `2k` for normal delivery and `4k` for commercial or crop-heavy work; use `1k` for drafts or speed. Never lower a higher live default.
- Videos: prefer `1080p` for normal delivery and supported `4k` for commercial or post-production work; use `720p` for drafts, cost, speed, or model limitations.
- Generate one result unless more are requested. Use about 5 seconds for one action, about 10 seconds for two connected beats, and longer only when supported and needed. Motion-control duration comes from the selected source and live constraints.
- Infer `9:16`, `1:1`, or `16:9` from the destination; preserve first-frame composition for image-to-video unless the tool requires an explicit ratio.

## Failure behavior

- Unauthorized: use native Claude Code OAuth and continue only after authorization succeeds.
- Unsupported argument: refresh the live definitions, revise only unsupported settings, and obtain confirmation before a new generation.
- Insufficient credits or provider failure: report the provider message and preserve the task number; do not resubmit.
- Expired media URL: query the original `generationId` for current outputs before reuse. A failed refresh is not permission to create a replacement task.
