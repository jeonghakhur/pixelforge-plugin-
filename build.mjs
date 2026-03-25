import * as esbuild from "esbuild";
import fs from "fs";

const isWatch = process.argv.includes("--watch");

// Build code.ts → dist/code.js
const codeBuild = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2020",
  format: "iife",
};

// Build ui.tsx → dist/ui.html (inline into HTML)
const uiPlugin = {
  name: "ui-html",
  setup(build) {
    build.onEnd(async () => {
      const js = fs.readFileSync("dist/ui.js", "utf8");
      // Extract the HTML template string from the built output
      const match = js.match(/var html = `([\s\S]*?)`;/);
      if (match) {
        fs.writeFileSync("dist/ui.html", match[1]);
      } else {
        console.error("❌ Could not extract HTML from ui.js");
        process.exit(1);
      }
      fs.unlinkSync("dist/ui.js");
      console.log("✅ Built dist/ui.html");
    });
  },
};

const uiBuild = {
  entryPoints: ["src/ui.tsx"],
  bundle: true,
  outfile: "dist/ui.js",
  target: "es2020",
  format: "iife",
  plugins: [uiPlugin],
};

async function main() {
  fs.mkdirSync("dist", { recursive: true });

  if (isWatch) {
    const codeCtx = await esbuild.context(codeBuild);
    const uiCtx = await esbuild.context(uiBuild);
    await codeCtx.watch();
    await uiCtx.watch();
    console.log("👀 Watching for changes...");
  } else {
    await esbuild.build(codeBuild);
    console.log("✅ Built dist/code.js");
    await esbuild.build(uiBuild);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
