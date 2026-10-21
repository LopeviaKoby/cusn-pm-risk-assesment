import { copyFileSync, mkdirSync } from "node:fs";

const output = new URL("../dist/licenses/", import.meta.url);
mkdirSync(output, { recursive: true });
for (const family of ["google-sans", "manrope"]) {
  copyFileSync(new URL(`../src/assets/fonts/${family}/OFL.txt`, import.meta.url), new URL(`${family}.txt`, output));
}
