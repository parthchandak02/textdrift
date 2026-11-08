import type { TextdriftSettings } from "./textdrift-settings";
import type { Weather } from "./weather-data";

export type TextdriftRasterRequest = { backingHeight: number; backingWidth: number; data: Weather; height: number; id: number; settings: TextdriftSettings;  width: number };
export type TextdriftRasterResponse = { bitmap?: ImageBitmap; error?: string; id: number };
