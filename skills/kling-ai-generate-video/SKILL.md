---
name: kling-ai-generate-video
description: Plan and generate Kling AI / 可灵 videos in Claude Code. Use for video prompts and storyboards even when the user says not to generate, next steps when a required image is missing, final settings for approval, and authorized text/image/omni video generation, keyframes or motion control.
---

# Kling AI video generation

Deliver the user's current step. Use the execution workflow only when preparing or submitting generation. The [core Kling Skill](../kling-ai/SKILL.md) owns OAuth, billing, task identity and result handling.

## Choose the current step

- **Prompt or storyboard only:** deliver that creative work and finish. Leave out model IDs and submission settings that have not been discovered. No account query, upload, model selection or question about moving to generation is needed.
- **Final settings for approval:** discover compatible capabilities, present a complete proposal, and wait. This is generation preparation, not prompt-only writing.
- **Authorized generation:** run the workflow below and honor approval already given for those settings.
- **Existing task:** query its known ID once for an explicit status request, then report the state.

If a required asset has not been supplied, request that asset and explain its role, then finish. For example: "请发商品图片或可访问的图片链接；它会用作首帧，收到后再确认生成设置。" Do not attach a questionnaire about destination, style, ratio or sound. If discovery does not return the user's only permitted model, report that limitation and finish; alternative model suggestions are outside that request.

## Finish at the requested deliverable

For a prompt/plan, finish after the requested creative text. For a missing asset,
finish after requesting it and explaining its role. Neither response needs a
"next steps" section or a question about generating later.

When reporting a generation submission or task-query result, use the returned
status, the known task ID, any result link, and the effective submitted settings.
A field absent from the model definition is unknown, not
proof of silence, mandatory audio, fixed pricing or visual quality. Do not add an
audio claim when the user did not request sound and no sound control was sent.
Keep submission count separate from credits: one submission or an exhausted local
budget is not one credit. State an actual charge only when the tool returns a
charged amount (such as `creditsConsumed`); otherwise the charge is unknown.
An unresolved error needs the known error and unknown state, then stop; do not
speculate about root causes or list incompatible alternatives.
If a generation submission returns no `generationId` and none is known for that
submission, neither call nor offer `query_tasks`: it requires a known ID and
cannot search task history. Report the unknown creation/billing state and stop.
Discovery and uploads do not need a generation ID; a query response that omits
the ID does not invalidate an ID already known for that task.

Read [motion and shots](references/motion-and-shots.md) for camera direction, continuity, multi-beat timing, or reference media. Read [scene patterns](references/scene-patterns.md) for product, advertising, social, or cinematic work. For Elements, the motion library, or local media, also read the core [asset workflows](../kling-ai/references/asset-workflows.md).

Recommend V4 only after the current account returns a tool/model pair that meets the request. Use "Recommended: V4" ("推荐使用 V4"), not "the latest model". User requirements take precedence over model preferences.

## Workflow

1. **Capture the request.** Keep the user's model restriction, duration, ratio, resolution, count, sound, shot intent, and each reference role together. Create or reuse one UUIDv7 task ID under the core Skill. These requirements determine eligibility before any model recommendation or upload.
2. **Discover eligible pairs.** Use the host's tool discovery to load candidate schemas, then query `who_am_i` for their models. Text-driven requests compare `text_to_video` and `omni_ref_video`; image-driven requests compare `image_to_video` and `omni_ref_video`, when present. No attachments does not exclude omni. Follow [capability discovery](../kling-ai/references/capability-discovery.md) and [video routing](references/model-routing.md) for remaining candidates, aliases, and motion control.
3. **Match requirements to actual support.** The requested model/family, output settings, sound and input roles must all fit the same live tool/model pair. For required silence, first eliminate entries without a declared sound-off value or explicit silent-output guarantee. A text-to-video name, missing audio field, or "silent" in a prompt supplies no such guarantee. Compare the remaining entries, including text-only omni when supported. Do not trade the requested model family for a sound control. A first-frame requirement needs a first-frame input, not a generic identity reference. If no pair fits, explain the unresolved requirement and stop.
4. **Build the request.** Load the chosen tool's complete `inputSchema` through `ToolSearch`; never call generation to discover its schema. Bind each explicit user setting to its own actual argument, including duration and a requested ratio when using a first frame. With a `[{name,value}]` schema, each item has only those two keys: `{"name":"duration","value":"7"}`; duration is not a property of the prompt item. Read [model parameters](../kling-ai/references/model-parameters.md) for the binding example, defaults and input slots. Prepare local media after selection; stop on upload failure. For ordered keyframes, describe only the motion needed between successive supplied states, then settle into the final state without overshooting or snapping back, unless the user requests otherwise. Write the motion-first prompt, then check the serialized request against the brief, not just the prose summary.
5. **Submit and finish.** Show the selected pair, prompt summary, all output settings, reference roles and required billing disclosure. Honor existing explicit authorization for the same unsubmitted intent and unchanged final settings; otherwise obtain approval. Invoke the generation tool once, including any rejected attempt; a second attempt needs fresh authorization. With a task ID, follow the core App/headless result rules using only `query_tasks` for follow-up. Without an ID, report the actual error and any unknown creation/billing state, then stop. A credit balance or absent history entry cannot establish that submission failed.

## Mode rules

- Element use requires explicit support for its resource type and binding argument in the selected model; do not infer it from the entry point name.
- Image-to-video and omni reference distinguish first frame, tail frame, keyframes, identity or product reference, style, video, and audio. Pass only roles declared by the selected model and satisfy all conditional combination limits. Pure-text omni reference requires a model that permits no media input.
- Keep audio references, generated sound, and original-sound retention distinct. Before proposing settings, verify audio controls and input slots against the selected model’s own live `arguments`/`inputs`; never borrow another model’s fields. Respect declared mutual exclusions, including `enable_audio` versus `keepOriginalSound`, and explicitly disable supported, unrequested content-expanding defaults. Omitting `music_prompt` does not guarantee no music. Separate submitted settings from audio/video quality actually inspected.
- A normal single-shot request is prompt intent. A smart-shot parameter fixed to `true` is not evidence that every output has cuts: keep its legal value, express one continuous shot, and disclose the limit without inventing a single-shot guarantee for another entry point. If the user explicitly requires a hard guarantee, resolve that requirement before submitting.
- Motion control requires a subject image. Choose exactly one motion source - a motion-library ID or a source video - as directed by the live tool. Use the core asset workflow to resolve library IDs and validate motion direction and duration.
- A multi-shot plan is one confirmed video task. Do not submit one generation per shot unless the user explicitly approves separate tasks.
- A status request uses only `query_tasks`; it does not create a video.

## Quality defaults

- Prefer `1080p` for normal delivery and supported `4k` for commercial, large-screen, or post-production work. Use `720p` for drafts, speed, credit savings, or model limitations. Never lower a higher live default.
- Use about 5 seconds for one action or shot, about 10 seconds for dialogue, a complete product action, or two connected beats, and longer only when supported and narratively necessary.
- Honor the user's explicit duration, ratio, resolution and count before applying defaults. For text-to-video with no requested ratio, infer it from the destination. For image-to-video with no requested ratio, preserve the first-frame composition unless the tool requires a ratio. An explicitly requested ratio must be passed when supported, even with a first frame.
- Use one primary camera movement in a five-second shot. Use multiple shots only when location, time, scale, or information state changes.
- Do not add unrequested narration, readable text, extra characters, product claims, prices, endorsements, or certifications.

Before submission, internally check whether the action fits the duration, camera instructions conflict, first and tail frame intent is clear, references remain continuous, and multi-shot durations sum correctly. Claim visual QA only when the result was actually inspected.
