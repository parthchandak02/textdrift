import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { textdriftReadiness, textdriftSectionInventory } from "../textdrift/textdrift-inventory";
import { CITY_PRESETS, FACES, TEXTDRIFT_TARGETS } from "../textdrift/textdrift-settings";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = textdriftReadiness;

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = textdriftSectionInventory;

type Budget = "extended-io" | "standard";
const browser = (testName: string, file: `e2e/${string}.spec.ts`, budget: Budget = "standard") => ({ budget, file, testName });

const domainFile = (id: string) => `e2e/product-textdrift-${id.split(".")[0]}.spec.ts` as const;

const sliderRow = (id: string, target: string, label: string, observable: string, interactionId: string): ToolcraftComponentAcceptance => ({
  automated: true,
  automatedTestName: `textdrift control ${target}`,
  browser: browser(`browser: textdrift control ${target}`, domainFile(id)),
  componentType: "slider",
  evidence: "product-output",
  expectedObservable: observable,
  fixture: "Default Wellington with stubbed Open-Meteo weather",
  id,
  interactionId,
  kind: "control",
  target,
  userAction: `Drag the ${label} slider.`,
});

const actionRow = (id: string, target: string, values: readonly string[], observable: string, interactionId: string): ToolcraftComponentAcceptance => ({
  actionCoverage: values,
  automated: true,
  automatedTestName: `textdrift control ${target}`,
  browser: browser(`browser: textdrift control ${target}`, domainFile(id)),
  componentType: "actions",
  evidence: "product-output",
  expectedObservable: observable,
  fixture: "Default Wellington with stubbed Open-Meteo weather",
  id,
  interactionId,
  kind: "control",
  target,
  userAction: "Click every button.",
});

const runtimeRow = (id: string, target: string, evidence: ToolcraftComponentAcceptance["evidence"], testName: string, file: `e2e/${string}.spec.ts`, budget: Budget = "standard"): ToolcraftComponentAcceptance => ({
  automated: true,
  automatedTestName: `textdrift contract ${id}`,
  browser: browser(testName, file, budget),
  componentType: id,
  evidence,
  expectedObservable: `The real product output and runtime workspace implement ${id}.`,
  fixture: "Default settings and real Toolcraft controls",
  id,
  kind: "runtime",
  target,
  userAction: `Exercise ${id} through its visible controls.`,
});

const exportTest = "browser: textdrift image export delivers every format and size";

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    ...sliderRow("words.text", TEXTDRIFT_TARGETS.text, "Text", "The poster sets the new words, each letter blown and coloured by the weather.", "text-property"),
    componentType: "text",
    userAction: "Type new words.",
  },
  actionRow("place.city", TEXTDRIFT_TARGETS.cityPreset, CITY_PRESETS.map((city) => city.value), "Each city names itself and its own weather moves and colours the letters.", "city-command"),
  sliderRow("place.latitude", TEXTDRIFT_TARGETS.latitude, "Latitude", "The weather reloads for the new place and the letters and figures change.", "latitude-property"),
  sliderRow("place.longitude", TEXTDRIFT_TARGETS.longitude, "Longitude", "The weather reloads for the new place and the poster changes.", "longitude-property"),
  {
    ...sliderRow("type.face", TEXTDRIFT_TARGETS.face, "Typeface", "Every letter is set in the chosen typeface.", "face-property"),
    componentType: "segmented",
    optionCoverage: FACES.map((face) => face.value),
    userAction: "Choose every Typeface option.",
  },
  sliderRow("type.drift", TEXTDRIFT_TARGETS.drift, "Drift", "Letters and trails move further or less far downwind.", "drift-property"),
  {
    ...runtimeRow("appearance.background", TEXTDRIFT_TARGETS.background, "product-output", "browser: textdrift background color changes output", "e2e/product-textdrift-appearance.spec.ts"),
    componentType: "color",
    interactionId: "background-color-property",
    kind: "control",
  },
  {
    ...runtimeRow("background.output", TEXTDRIFT_TARGETS.includeBackground, "product-output", "browser: textdrift background output follows runtime semantics", "e2e/product-textdrift-background.spec.ts"),
    backgroundOutputCoverage: "all-required-background-output",
    componentType: "switch",
    interactionId: "background-include-property",
    kind: "control",
  },
  ...(["format", "resolution"] as const).map(
    (key): ToolcraftComponentAcceptance => ({
      ...runtimeRow(`export.image.${key}`, `export.image.${key}`, "exported-bytes", exportTest, "e2e/product-textdrift-export.spec.ts", "extended-io"),
      componentType: "select",
      kind: "control",
      optionCoverage: key === "format" ? ["png", "jpg"] : ["2k", "4k", "8k"],
    }),
  ),
  {
    ...runtimeRow("export.image", "actions.output", "exported-bytes", exportTest, "e2e/product-textdrift-export.spec.ts", "extended-io"),
    actionCoverage: ["export.png"],
    componentType: "panelActions",
    kind: "control",
    exportArtifactCoverage: "all-required-image-export-behavior",
  },
  {
    ...runtimeRow("export.infinity", "actions.output", "exported-bytes", exportTest, "e2e/product-textdrift-export.spec.ts", "extended-io"),
    infinityCanvasCoverage: "scene-bounds-image-export",
  },
  {
    ...runtimeRow("canvas.size", "canvas.size.width", "product-output", "browser: textdrift canvas sizing changes output", "e2e/product-textdrift-canvas.spec.ts"),
  },
  {
    ...runtimeRow("canvas.scale", "canvas.renderScale", "product-output", "browser: textdrift backing preserves selected render scale", "e2e/product-textdrift-canvas.spec.ts"),
    renderScaleCoverage: { kind: "selected-backing-pixels", states: ["interaction", "steady"] },
  },
  {
    ...runtimeRow("canvas.infinity", "canvas.infinity", "viewport-side-effect", "browser: textdrift infinity preserves scene and viewport", "e2e/product-textdrift-canvas.spec.ts"),
    infinityCanvasCoverage: "mode-continuity-and-restoration",
  },
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the starter schema",
    browser: {
      budget: "extended-io",
      file: "e2e/product-textdrift-persistence.spec.ts",
      testName: "browser: textdrift restores poster and workspace after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "Canvas size, zoom, the chosen city and the moved, collapsed Controls panel are restored after a real reload, and the poster matches its pre-reload pixels.",
    fixture: "Textdrift persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [],
    target: "canvas.size.width",
    userAction: "Change Canvas width, pick Singapore, zoom in, move and collapse Controls, wait for persistence, and reload the page.",
  },
];
