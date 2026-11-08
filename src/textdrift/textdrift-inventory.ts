import type { ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness } from "../app/acceptance/types";
import { TEXTDRIFT_TARGETS } from "./textdrift-settings";

export const textdriftSectionInventory = [
  {
    entity: "Output background", entityId: "background",
    finiteSelectors: [{ reason: "Shows or hides the background fill and PNG alpha; the color stays editable either way.", role: "parameter", target: TEXTDRIFT_TARGETS.includeBackground }],
    groupingReason: "One output background; runtime relocates this source pair into Settings.",
    id: "runtime.setup", targets: [TEXTDRIFT_TARGETS.includeBackground, TEXTDRIFT_TARGETS.background], title: "Settings",
  },
  {
    entity: "Words", entityId: "words", finiteSelectors: [],
    groupingReason: "The one line of text the weather acts on.",
    id: "words", targets: [TEXTDRIFT_TARGETS.text], title: "Words",
  },
  {
    entity: "Place", entityId: "place", finiteSelectors: [],
    groupingReason: "Cities, latitude and longitude choose whose weather is used; cities only set the two sliders.",
    id: "place", targets: [TEXTDRIFT_TARGETS.cityPreset, TEXTDRIFT_TARGETS.latitude, TEXTDRIFT_TARGETS.longitude], title: "Place",
  },
  {
    entity: "Type", entityId: "type",
    finiteSelectors: [{ reason: "Chooses the typeface; every other control stays relevant.", role: "parameter", target: TEXTDRIFT_TARGETS.face }],
    groupingReason: "Typeface and drift style the same letters.",
    id: "type", targets: [TEXTDRIFT_TARGETS.face, TEXTDRIFT_TARGETS.drift], title: "Type",
  },
  {
    entity: "Raster image output", entityId: "image-export",
    finiteSelectors: [
      { reason: "Selects PNG alpha support or opaque JPEG encoding.", role: "parameter", target: "export.image.format" },
      { reason: "Selects the output long-edge pixel size.", role: "parameter", target: "export.image.resolution" },
    ],
    groupingReason: "Runtime-owned image format and resolution govern one exported artifact.",
    id: "runtime.image-export", targets: ["export.image.format", "export.image.resolution"], title: "Image Export",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];

const edit = (id: string, target: string, detail: string) => ({
  alternative: { reason: "Persistent value controls on the poster would cover it.", surface: "canvas" as const },
  capability: "property-edit" as const, evidence: { detail, source: "usability-analysis" as const }, id,
  reason: "A global setting of the whole poster with no spatial handle.", selectionScope: { mode: "global" as const }, surface: "panel" as const, target,
});

export const textdriftReadiness: ToolcraftProductReadiness = {
  exportIntent: { image: { mode: "toolcraft-default" }, svg: { mode: "not-requested" }, video: { mode: "not-requested" } },
  interactionOwnership: [
    edit("text-property", TEXTDRIFT_TARGETS.text, "The words are one value for the whole poster."),
    edit("latitude-property", TEXTDRIFT_TARGETS.latitude, "Latitude is one number for the whole poster."),
    edit("longitude-property", TEXTDRIFT_TARGETS.longitude, "Longitude is one number for the whole poster."),
    edit("face-property", TEXTDRIFT_TARGETS.face, "The typeface applies to every letter."),
    edit("drift-property", TEXTDRIFT_TARGETS.drift, "Drift applies to every letter."),
    edit("background-color-property", TEXTDRIFT_TARGETS.background, "Runtime places the background color in Settings."),
    edit("background-include-property", TEXTDRIFT_TARGETS.includeBackground, "Runtime places the Background switch in Settings."),
    {
      alternative: { reason: "A shortcut command has no position on the poster.", surface: "canvas" },
      capability: "command", evidence: { detail: "City buttons set latitude and longitude.", source: "usability-analysis" },
      id: "city-command", reason: "Shortcuts sit beside the sliders they set.", surface: "panel", target: TEXTDRIFT_TARGETS.cityPreset,
    },
  ],
  mode: "product",
  productName: "Textdrift",
  productSummary: "A typographic weather poster: your words set large and pushed downwind by the live wind with fading trails, coloured from the air temperature to the feels-like temperature, crossed by rain when it falls, with the current conditions below.",
  requestedBehavior: "Rebuild Textdrift on the current Toolcraft with a much better design: type words, choose a place, and see the current weather act on the letters as a still poster that exports as an image.",
  viewInteraction: { mode: "non-spatial", reason: "The output is a two-dimensional poster, not a three-dimensional scene." },
};
