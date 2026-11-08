import { defineToolcraftPerformance, deriveToolcraftPerformancePaths, type ToolcraftPerformanceScenario } from "@/toolcraft/runtime";

import { textdriftPerformanceModel } from "../textdrift/textdrift-performance-model";
import { appSchema } from "./app-schema";

export const textdriftPerformancePaths = deriveToolcraftPerformancePaths(appSchema, textdriftPerformanceModel);

export const appPerformance = defineToolcraftPerformance({
  ...textdriftPerformanceModel,
  scenarios: textdriftPerformancePaths.map(
    (path, index): ToolcraftPerformanceScenario =>
      ({
        automated: true,
        automatedTestName: "textdrift render plan has valid derived paths and fixtures",
        browser: true,
        browserTestName: `browser perf: toolcraft path ${path.id}`,
        coversTargets: path.targets,
        expectedObservable: "The weather type poster, viewport or decoded artifact reflects the exact applied operation.",
        fixture: "Compiled reachable textdrift workload",
        id: `textdrift-path-${index}`,
        interaction: path.interaction,
        pathId: path.id,
        uiSelector: '[data-testid="textdrift-output"]',
        ...(path.interaction === "export" ? { actionValue: "export.png", completionEvidence: "download" as const, controlLabel: "Export PNG" } : {}),
      }) as ToolcraftPerformanceScenario,
  ),
});
