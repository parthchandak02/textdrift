import type { ToolcraftProductExportRenderer } from "@/toolcraft/runtime";

import { drawTextdrift } from "./textdrift-draw";
import { exportPass } from "./textdrift-pipeline";
import { readTextdriftSettings } from "./textdrift-settings";
import { loadWeather } from "./weather-data";

export const textdriftExport: ToolcraftProductExportRenderer = {
  baseFileName: "textdrift",
  async renderFrame({ context, frame, rendererPipeline, signal, state }) {
    const settings = readTextdriftSettings(state.values);
    const data = await loadWeather(settings.latitude, settings.longitude);
    const render = () => {
      signal.throwIfAborted();
      context.save();
      context.translate(frame.x, frame.y);
      drawTextdrift(context, frame.width, frame.height, settings, data);
      context.restore();
      signal.throwIfAborted();
    };
    if (rendererPipeline) await rendererPipeline.runPass(exportPass, undefined, render);
    else render();
  },
};
