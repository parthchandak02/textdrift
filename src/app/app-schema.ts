import { defineToolcraft } from "@/toolcraft/runtime";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    upload: false,
    sizing: {
      mode: 'editable-output',
    },
  },
  panels: {
    controls: {
      sections: [
        {
          title: "Text",
          controls: {
            userText: {
              type: "text",
              target: "userText",
              label: "Text",
              defaultValue: "textdrift",
              description: "Type any words to see them drift with Singapore weather",
            },
          },
        },
        {
          title: "Typography",
          controls: {
            fontSize: {
              type: "slider",
              target: "fontSize",
              label: "Font Size",
              min: 12,
              max: 60,
              step: 1,
              defaultValue: 32,
              description: "Size of the floating letters",
            },
          },
        },
        {
          title: "Weather Effect",
          controls: {
            windMultiplier: {
              type: "slider",
              target: "windMultiplier",
              label: "Wind Multiplier",
              min: 0,
              max: 3,
              step: 0.1,
              defaultValue: 1,
              description: "Amplify wind effect on letter drift",
            },
            particleSpread: {
              type: "slider",
              target: "particleSpread",
              label: "Particle Spread",
              min: 0.5,
              max: 3,
              step: 0.1,
              defaultValue: 1,
              description: "How spread out letters appear",
            },
          },
        },
        {
          title: "Color",
          controls: {
            colorMood: {
              type: "segmented",
              target: "colorMood",
              label: "Color Mood",
              options: [
                { label: "Cool", value: "cool" },
                { label: "Mixed", value: "mixed" },
                { label: "Warm", value: "warm" },
              ],
              defaultValue: "mixed",
              description: "Temperature color palette preference",
            },
          },
        },
      ],
      title: "Controls",
    },
  },
  toolbar: {
    history: false,
    radar: false,
    zoom: false,
  },
  persistence: {
    storage: "none",
  },
});
