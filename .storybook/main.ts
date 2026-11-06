import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../app/src/stories/foundations/*.stories.@(ts|tsx)", "../app/src/stories/atoms/*.stories.@(ts|tsx)", "../app/src/stories/catalogs/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  staticDirs: [{ from: "../app/src/assets/img", to: "/brand" }],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
