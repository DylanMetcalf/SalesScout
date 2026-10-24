import type { Hue } from "@/content/site";

/** Category hue name → its CSS token, for setting `--hue` on a `.hue` element. */
export const HUE_VAR: Record<Hue, string> = {
  cobalt: "var(--hue-cobalt)", vermilion: "var(--hue-vermilion)", jade: "var(--hue-jade)", saffron: "var(--hue-saffron)",
  orchid: "var(--hue-orchid)", sky: "var(--hue-sky)", rose: "var(--hue-rose)", olive: "var(--hue-olive)",
};
