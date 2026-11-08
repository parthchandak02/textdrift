import { getToolcraftFiniteArtboardRect } from "@/toolcraft/runtime";
import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { handleTextdriftAction } from "../textdrift/textdrift-actions";
import { TextdriftCanvas } from "../textdrift/TextdriftCanvas";
import { textdriftExport } from "../textdrift/textdrift-export";
import { textdriftPipeline } from "../textdrift/textdrift-pipeline";
import { appSchema } from "./app-schema";

export const appComposition = composeToolcraftApp(appSchema, {
  actions: { onPanelAction: handleTextdriftAction },
  renderer: { pipelineRegistration: textdriftPipeline },
  scene: {
    canvasContent: <TextdriftCanvas />,
    rasterFrameRenderer: textdriftExport,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [getToolcraftFiniteArtboardRect(state.canvas.size)],
  },
});
