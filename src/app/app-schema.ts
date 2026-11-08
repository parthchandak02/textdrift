import { defineToolcraft, imageExportModule } from "@/toolcraft/runtime";

import { backgroundControls, placeControls, typeControls, wordsControls } from "../textdrift/textdrift-controls";
import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";

export const appSchema = defineToolcraft({
  base: {
    canvas: { draggable: true, enabled: true, renderScale: true, size: { height: 1080, unit: "px", width: 1920 }, sizing: { mode: "editable-output" }, upload: false },
    identity: appIdentity,
    panels: {
      controls: {
        sections: [
          { controls: backgroundControls, id: "runtime.setup", title: "Settings" },
          { controls: wordsControls, id: "words", title: "Words" },
          { controls: placeControls, id: "place", title: "Place" },
          { controls: typeControls, id: "type", title: "Type" },
        ],
        title: "Textdrift",
      },
    },
    toolbar: { history: true, radar: true, theme: true, zoom: true },
  },
  defaults: appDefaults,
  modules: [imageExportModule()],
});
