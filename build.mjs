import * as esbuild from "esbuild";
import fs from "fs";

const isWatch = process.argv.includes("--watch");

const codeBuild = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  format: "iife",
  charset: "utf8",
};

const uiBuild = {
  entryPoints: ["src/ui.js"],
  bundle: true,
  write: false,
  format: "iife",
  target: "es2017",
  charset: "utf8",
};

async function buildUI() {
  const result = await esbuild.build(uiBuild);
  const script = result.outputFiles[0].text;
  const template = fs.readFileSync("src/ui.html", "utf8");
  const output = template.replace("<!-- UI_SCRIPT_PLACEHOLDER -->", "<script>\n" + script + "</script>");
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/ui.html", output);
  console.log("✅ Built dist/ui.html");
}

async function main() {
  fs.mkdirSync("dist", { recursive: true });

  if (isWatch) {
    const codeCtx = await esbuild.context(codeBuild);
    await codeCtx.watch();

    // Watch entire src/ directory for UI changes
    fs.watch("src", { recursive: true }, () => {
      buildUI().catch(console.error);
    });

    await buildUI();
    console.log("👀 Watching for changes...");
  } else {
    await esbuild.build(codeBuild);
    console.log("✅ Built dist/code.js");
    await buildUI();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
