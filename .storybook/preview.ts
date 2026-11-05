import type { Preview } from "@storybook/react-vite";
import "../src/design-system/app.css";

/* Laboratorio permanente Light/Dark. Importa el mismo entry CSS de la app
 * (app.css → fonts.css + tokens.css). No copia tokens ni hardcodea HEX.
 * El decorador aplica la clase producto .light/.dark en el canvas (iframe),
 * sin tocar el tema real de la app ni crear un segundo controlador.
 * No confundir manager vs canvas/iframe: globals.theme solo afecta al iframe.
 */

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Tema producto Light/Dark",
    defaultValue: "light",
    toolbar: {
      icon: "circlehollow",
      items: ["light", "dark"],
      showName: true,
    },
  },
};

export const initialGlobals = {
  theme: "light",
};

function applyTheme(theme: string) {
  const root = document.documentElement;
  const light = theme !== "dark";
  root.classList.toggle("light", light);
  root.classList.toggle("dark", !light);
  root.style.colorScheme = light ? "light" : "dark";
}

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    docs: { source: { type: "code" } },
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "focus-order-semantics", enabled: true },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "light";
      applyTheme(theme);
      return (
        <div className={theme === "dark" ? "dark" : "light"} data-lab-theme={theme}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
