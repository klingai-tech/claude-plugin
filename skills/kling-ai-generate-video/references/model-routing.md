# Video entry points and model selection

First follow [capability discovery](../../kling-ai/references/capability-discovery.md). A discovered tool is not proof that any particular model is enabled. Never route by tool count, a static model name, or an earlier account's capabilities.

| Complete live discovery | Routing |
| --- | --- |
| No `omni_ref_video` | Use `text_to_video`, `image_to_video`, or `motion_control` according to intent and available model capabilities. A new model returned on these tools remains eligible. |
| `omni_ref_video` exists | Query its models together with relevant existing video tools, even for pure-text requests. Prefer an applicable newer generation returned there, subject to the user's model and capability requirements. |
| Omni reference returns only existing models, no compatible models, or generation order is unclear | For ordinary text/image/motion requests, retain the existing tool and its compatible live default. Use omni reference when its actual capabilities are needed and a returned model satisfies the request. |
| Discovery failed or the requested model/capability is unavailable | Resolve the discovery failure or explain the current limitation. Do not silently use an older model, remove references, or generate to test availability. |

User-specified available models take precedence. Select quality/speed variants using actual descriptions, and use real billing information for budget choices. Do not raise resolution or output count merely because a newer model is available.

## Intent and inputs

- Text-only video can use `omni_ref_video` only if the chosen model explicitly permits no media inputs; otherwise use a compatible `text_to_video` model. The word "reference" in the tool name does not make attachments mandatory.
- Image, video, Element, and audio references can use `omni_ref_video` only when the selected model supports each requested type and their combination. Do not treat its general tool description as every model's capability list.
- Keyframes belong to whichever discovered tool/model declares the needed frame inputs. Do not hardcode them to one entry point, invent intermediate frames, or substitute identity references for frame control.
- Motion transfer must use a model that explicitly supports that intent and all required inputs. Existing `motion_control` requests keep the subject image and exactly one motion source.
- Do not move an omni model to `image_to_video` or `text_to_video`; tool/model pairs and their parameter sets are inseparable.

After selection, apply [model parameters](../../kling-ai/references/model-parameters.md), including conditional reference caps, Elements, and audio exclusivity. One multi-shot plan remains one task unless separate tasks were explicitly approved. The core Skill's billing, single-submission, and result rules apply to omni reference too.
