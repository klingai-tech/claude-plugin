---
name: kling-ai-generate-video
description: Generate videos through the Kling AI MCP in Claude Code. Use for text-to-video, image-to-video, omni reference, keyframes, audio-guided video, motion control, product showcases, advertising clips, social videos, cinematic shots, and storyboard planning.
---

# Kling AI video generation

Turn the request into one coherent motion plan and one user-confirmed remote video generation. Follow the Claude Code OAuth, billing confirmation, single-submission, status, and result rules in the [core Kling Skill](../kling-ai/SKILL.md).

Read [motion and shots](references/motion-and-shots.md) for camera direction, continuity, multi-beat timing, or reference media. Read [scene patterns](references/scene-patterns.md) for product, advertising, social, or cinematic work. For Elements, the motion library, or local media, also read the core [asset workflows](../kling-ai/references/asset-workflows.md).

## Workflow

1. Follow [video model routing](references/model-routing.md) and the core [capability discovery](../kling-ai/references/capability-discovery.md) before choosing a tool/model pair. Discover `text_to_video`, `image_to_video`, and `omni_ref_video` as applicable; include omni reference in model discovery even without attachments. Keep `motion_control` for compatible motion-transfer requests.
2. Ask only for missing information that materially changes the result: destination and aspect ratio, duration, required references, protected facts, narration or copy, or shot structure.
3. Create or reuse the UUIDv7 `taskTraceId` for this objective. Use this preparation's `who_am_i` response to select a compatible tool/model pair, then apply [model parameters](../kling-ai/references/model-parameters.md) for output specifications, reference caps, Element types, and sound dependencies. Query unexamined candidates or refresh stale data when needed.
4. Upload local media first. Distinguish first frame, tail frame, identity or product reference, style reference, and motion source. Never silently degrade modes after an upload failure.
5. Build a motion-first prompt covering opening composition, subject action, camera movement, environmental motion, timing, continuity, protected facts, light, materials, and necessary exclusions.
6. Show the final mode, model, prompt summary, duration, resolution, aspect ratio, output count, shot structure, and reference roles. Obtain explicit approval under the core Skill's billing rule; honor an existing explicit authorization for the final settings.
7. Call the selected video or motion tool exactly once and preserve the task number. If its MCP App mounts, let that one App self-refresh and do not call `query_tasks` from the model. If no App mounts, follow the core Skill's headless polling fallback; never resubmit.
8. When Claude Code renders the MCP App, do not add Markdown media or duplicate links. When no App is rendered, provide one primary video link.

## Mode rules

- Element use requires explicit support for its resource type and binding argument in the selected model; do not infer it from the entry point name.
- Image-to-video and omni reference distinguish first frame, tail frame, keyframes, identity or product reference, style, video, and audio. Pass only roles declared by the selected model and satisfy all conditional combination limits. Pure-text omni reference requires a model that permits no media input.
- Audio inputs, generated sound, and original-sound retention are separate capabilities. Respect declared mutual exclusion, including `enable_audio` versus `keepOriginalSound`, and do not add unrequested sound or multi-shot output because a model enables it by default.
- Motion control requires a subject image. Choose exactly one motion source - a motion-library ID or a source video - as directed by the live tool. Use the core asset workflow to resolve library IDs and validate motion direction and duration.
- A multi-shot plan is one confirmed video task. Do not submit one generation per shot unless the user explicitly approves separate tasks.
- A status request uses only `query_tasks`; it does not create a video.

## Quality defaults

- Prefer `1080p` for normal delivery and supported `4k` for commercial, large-screen, or post-production work. Use `720p` for drafts, speed, credit savings, or model limitations. Never lower a higher live default.
- Use about 5 seconds for one action or shot, about 10 seconds for dialogue, a complete product action, or two connected beats, and longer only when supported and narratively necessary.
- For text-to-video, infer `9:16`, `1:1`, or `16:9` from the destination. For image-to-video, preserve the first-frame composition unless the tool requires an explicit ratio.
- Use one primary camera movement in a five-second shot. Use multiple shots only when location, time, scale, or information state changes.
- Do not add unrequested narration, readable text, extra characters, product claims, prices, endorsements, or certifications.

Before submission, internally check whether the action fits the duration, camera instructions conflict, first and tail frame intent is clear, references remain continuous, and multi-shot durations sum correctly. Claim visual QA only when the result was actually inspected.
