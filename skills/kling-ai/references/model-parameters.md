# Parameters for the selected model

Read after [capability discovery](capability-discovery.md). Use the chosen tool/model pair's complete live `arguments`, `inputs`, defaults, enums, and conditional constraints. These rules do not supply a static model or specification table.

## Request and output settings

- Treat the model's arguments and inputs as field allowlists. Satisfy required fields and dependencies; omit undeclared fields and irrelevant optional fields. When there are no inputs, omit `inputs` unless the tool schema requires otherwise.
- Pass each argument name once and encode numbers, booleans, and JSON arrays as required by the tool schema. Use only exact enum values. Rebuild the request when changing models; do not carry over the previous model's fields.
- Honor explicit user settings first, then apply the Skill's quality preferences only within legal choices and compatible defaults. Never use prompt text to simulate an unsupported resolution, input, or sound capability. Unsupported required settings need resolution before submission.
- Follow model-specific aspect-ratio rules first. If the model says to omit the optional ratio when a first frame is supplied and the user has not requested a ratio, omit it to preserve that frame. Otherwise, when a ratio field exists, set a legal value from the requested destination or compatible live default. An automatic ratio may depend on image/video inputs; for text-only requests that disallow automatic ratio, choose a legal explicit ratio. If no ratio field exists, omit it rather than inventing an alternative name.
- Duration must accommodate action, dialogue, pauses, and the ending within live limits. Do not delete dialogue, speed it up, or split it into multiple paid tasks to hide a conflict.
- Content-expanding defaults must respect the user's intent: if declared and supported, explicitly select one result, a single continuous shot, and no generated sound unless the request calls for more. This includes fields such as `imageCount`, `prefer_multi_shots`, `enable_audio`, and `enable_asmr` only when that model declares them. If the model cannot meet the requested output structure or silence, explain the limitation.
- Respect single-value enums: if `prefer_multi_shots` is declared and allows only `true`, never send `false`. Whether to omit an optional field follows the live schema and its default. This field describes smart shot splitting; its presence does not prove that every output must contain multiple shots. Neither omitting it nor choosing an entry point without it guarantees a single shot. Describe a continuous-shot prompt as the requested intent, not a guaranteed result; do not recommend another entry point as a guarantee without an explicit live capability. Do not infer an output guarantee or switch models solely from this field.

## References and Elements

Apply only when using actual/required reference inputs or Elements. Read [asset workflows](asset-workflows.md) for lookup and upload operations.

- Map each real asset to its declared input slot and prompt reference. Distinguish first/tail frames, identity/product references, style, motion, and source material for editing. Follow the selected model's binding syntax; do not copy syntax from another model.
- For keyframes, preserve frame order and describe transitions. Do not invent intermediate-frame slots, timestamps, or a frame-count formula. A first frame controls the opening, not all subsequent camera movement.
- Validate accepted resource origin, format, size, dimensions, and per-resource/total duration from live constraints. Inspect actual metadata when possible; never claim validation based only on filenames. Do not silently remove required assets after an upload failure or to fit a limit.
- Call `element_get` before reuse and check the actual resource type. The model must declare both the binding argument and support for that Element type. Follow `elementSupport` restrictions on image/video types, individual and total counts, and conditions when reference video is present. An Element does not replace required image inputs; a video Element's cover is not a substitute for the video resource.
- Check `maxItems` and `combinedItemCap` when declared. For `combinedItemCaps[]`, evaluate `whenAnyInputPrefixes` and `whenNoneInputPrefixes` against actual inputs, and satisfy every applicable cap. Count actual items, not the highest numbered slot; count Elements as specified. Library storage capacity is separate from the number of references allowed in one generation.
- Preserve the motion-control requirement for a subject image and exactly one supported motion source. Do not use a preview URL in place of a motion ID.

## Sound and audio

Apply only when the selected model declares the relevant capability and the request uses it or a dependency requires a decision.

- Distinguish newly generated sound, preserved source-video audio, silence, dialogue, and narration. Map them only to declared controls and values; a tool-level audio description does not establish support for every model.
- If the model makes `enable_audio` and `keepOriginalSound` mutually exclusive, never enable both. Only send either field if declared. Explain incompatible user requirements rather than hiding the conflict in the prompt.
- Audio references use only declared audio slots, formats, duration limits, and reference syntax. Never pass audio through image/video slots or assume that accepting audio guarantees voice cloning or exact speech.
- Preserve user-supplied dialogue verbatim, including speaker, language, tone, and order. Narration does not become on-screen dialogue, and dialogue does not automatically authorize subtitles or slogans.
- Check timing and audio intent against the prompt and actual parameters before submission. After generation, claim sound or dialogue QA only after inspecting the real audio track; a cover or silent preview is insufficient.
