import { ToolcraftApp } from "@/toolcraft/runtime/react";
import { appSchema } from "../app/app-schema";
import { TextDriftCanvas } from "../app/TextDriftCanvas";

export function AppHome(): React.JSX.Element {
  return <ToolcraftApp className="h-dvh min-h-dvh" schema={appSchema} canvasContent={<TextDriftCanvas />} />;
}
