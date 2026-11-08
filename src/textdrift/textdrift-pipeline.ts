import { registerToolcraftRendererPipeline, type ToolcraftRendererPipelinePassContract } from "@/toolcraft/runtime";

import type { TextdriftRasterClient } from "./textdrift-raster-client";
import { TEXTDRIFT_TARGETS } from "./textdrift-settings";

const productTargets = [TEXTDRIFT_TARGETS.text, TEXTDRIFT_TARGETS.latitude, TEXTDRIFT_TARGETS.longitude, TEXTDRIFT_TARGETS.face, TEXTDRIFT_TARGETS.drift, TEXTDRIFT_TARGETS.background, TEXTDRIFT_TARGETS.includeBackground];
const rasterInputs = [...productTargets, "canvas.size.width", "canvas.size.height", "canvas.renderScale", "canvas.zoom"];

export const textdriftPipeline = registerToolcraftRendererPipeline<{
  export: ToolcraftRendererPipelinePassContract<void>;
  raster: ToolcraftRendererPipelinePassContract<string | null, TextdriftRasterClient, readonly ["textdrift"]>;
}>()({
  interactionInvalidation: [
    { interaction: "initial-render", invalidates: ["raster"], targets: ["canvas"] },
    { interaction: "control-drag", invalidates: ["raster"], targets: [TEXTDRIFT_TARGETS.latitude, TEXTDRIFT_TARGETS.longitude, TEXTDRIFT_TARGETS.drift, "canvas.renderScale"] },
    { interaction: "control-change", invalidates: ["raster"], targets: [TEXTDRIFT_TARGETS.text, TEXTDRIFT_TARGETS.cityPreset, TEXTDRIFT_TARGETS.face, TEXTDRIFT_TARGETS.background, TEXTDRIFT_TARGETS.includeBackground, "canvas.size.width", "canvas.size.height"] },
    { interaction: "control-change", invalidates: [], mustNotInvalidate: ["raster"], targets: ["canvas.infinity", "canvas.workspaceBackground", "export.image.format", "export.image.resolution"] },
    { interaction: "viewport-drag", invalidates: [], mustNotInvalidate: ["raster"], targets: ["canvas"] },
    { interaction: "viewport-zoom", invalidates: ["raster"], targets: ["canvas"] },
    { interaction: "export", invalidates: ["export"], mustNotInvalidate: ["raster"], targets: ["export.image"] },
  ],
  passes: [
    {
      cacheKey: ["request"],
      cost: { dimensions: ["width", "height", "scale", "zoom"], frequency: "interaction", relationship: "product" },
      id: "raster",
      inputs: rasterInputs,
      invalidatedBy: rasterInputs,
      kind: "rasterize",
      lifecycle: { cache: "retained-resource", resourceScope: "renderer" },
      output: "preview",
      quality: "retina",
      runsOn: "worker",
      sceneBounds: { kind: "intrinsic", reason: "Textdrift is a poster laid out inside its artboard; every element is positioned from the frame size, so nothing is drawn outside it." },
    },
    {
      cost: { dimensions: ["resolution"], frequency: "batch", relationship: "product" },
      id: "export",
      inputs: [...productTargets, "export.image.resolution"],
      invalidatedBy: ["export.image"],
      kind: "export",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "export",
      quality: "export",
      runsOn: "export-only",
    },
  ],
  runtimeId: "textdrift-weather-type-v1",
});

export const rasterPass = textdriftPipeline.getPass("raster");
export const exportPass = textdriftPipeline.getPass("export");
