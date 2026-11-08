import type { ToolcraftCommand } from "@/toolcraft/runtime";

import { CITY_PRESETS, TEXTDRIFT_TARGETS } from "./textdrift-settings";

type ActionContext = { action: { value: string }; dispatch: (command: ToolcraftCommand) => void };

export function handleTextdriftAction({ action, dispatch }: ActionContext): void {
  const city = CITY_PRESETS.find((preset) => preset.value === action.value);
  if (!city) return;
  dispatch({ label: city.label, target: TEXTDRIFT_TARGETS.latitude, type: "controls.setValue", value: city.latitude });
  dispatch({ label: city.label, target: TEXTDRIFT_TARGETS.longitude, type: "controls.setValue", value: city.longitude });
}
