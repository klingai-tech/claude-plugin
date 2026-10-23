# Prompt and usage examples

## Suggested prompts

- Draw a red panda in a vintage spacesuit floating by a space station window, Earth’s blue glow lighting its face, richly detailed, cinematic look
- Create a 5-second cinematic video: a mecha warrior crashes down from the sky, shockwave blasting rocks and dust, camera rapidly pushing in with raw power
- Create a 15-second sneaker marketing short: open with a street hook, cut to product close-ups and on-foot action within three seconds, end on a shoe detail close-up

## Natural-language requests

Text-to-video:

> Use Kling AI to create a 5-second, 16:9 cinematic video: outside a convenience store on a rainy night, a vintage motorcycle slowly pulls to a stop as the camera smoothly pushes in from a wide shot. Keep this turn active after submission until the result appears.

Image-to-video:

> Turn my attached image into a 5-second video. Keep the subject's identity, facial features, and clothing consistent; only let the camera slowly orbit from the left to the front. Use 720p.

Multi-shot VIDEO 3.0:

> Create a 7-second, four-shot product video: a 1.5-second wide establishing shot, a 2-second push-in on the product, a 2-second side orbit, and a 1.5-second hold on the brand detail. Enable multi-shot mode and use natural transitions between shots.

Text-to-image:

> Use Kling AI to create a 16:9 hero image for a poster: a transparent glass teapot in a minimalist white studio with soft side lighting and negative space for a headline on the right.

Immediate submission with explicit approval:

> Submit immediately without asking for confirmation again: use Kling AI to create a 5-second, 16:9, 720p single-shot video. Outside a convenience store on a rainy night, a vintage motorcycle slowly pulls to a stop.

Status check:

> Check the current status of this Kling generationId once. Do not poll repeatedly.

Motion-library browsing:

> List my saved motions with their names, IDs, and durations. Do not generate anything.

Motion control:

> Use my attached subject image with the motion named "Walking" from my library. Resolve the motion and show the supported model and final settings before submitting.

Element creation:

> Save these reference images as a reusable subject named "Blue sneaker". Show which image will be the cover and use the others as secondary views.

Element update:

> Update only the description of "Blue sneaker" to "Blue suede sneaker with white sole". Keep its cover, secondary images, and tags unchanged.

Element reuse:

> Use my "Blue sneaker" Element in a product image. Check its resource type and model compatibility first, and tell me if another source image is required.

## Prompt construction

Prefer concrete direction in this order:

1. subject and setting
2. action or transformation
3. camera and shot structure
4. lighting and visual style
5. identity or consistency constraints
6. exclusions only when they prevent a likely failure

Avoid long lists of repeated negatives. For image-to-video, state what must
remain stable and what is allowed to move.

## User-facing submission summary

Use one compact block:

```text
Ready to submit: image-to-video · VIDEO 3.0 Turbo · 5 seconds · 720p · single shot
Action: keep the subject stable while the camera slowly orbits from the left to the front
Submission will consume Kling AI credits.
Reply "Confirm submission" to create one generation task.
```

After acceptance:

```text
The task was submitted once. Any follow-up will only query this generationId; it will not create another task.
You may end this conversation; the task will continue running on Kling AI.
```
