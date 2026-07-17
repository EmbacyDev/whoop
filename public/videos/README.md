# Intro video placeholder

The Figma "Video preloader" frame only contains a static reference still
(the person writing in a journal) — there is no exportable video asset in
the file, so no video ships in this repo.

To wire up the real intro video:

1. Add your final video file here as `intro.mp4` (this exact filename/path
   is already wired up in `VideoPreloader.tsx` via `PLACEHOLDER_VIDEO_SRC`).
2. Optionally update `src/assets/images/video-poster.jpg` to a still frame
   from the real video (used as the `poster` attribute and as the fallback
   image shown if the browser can't play the video yet).
3. That's it — remove `PLACEHOLDER_HOLD_MS` handling in `VideoPreloader.tsx`
   once you no longer need the "asset missing" fallback state.

Until a real file is added, the site shows a clearly labeled placeholder
(the reference still + a small badge) for a few seconds and then
auto-advances into the Hero section, so the rest of the experience stays
testable end-to-end.
