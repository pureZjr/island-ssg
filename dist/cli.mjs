var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// package.json
var require_package = __commonJS({
  "package.json"(exports, module) {
    module.exports = {
      name: "islang-ssg",
      version: "1.0.0",
      description: "",
      main: "index.js",
      scripts: {
        start: "tsup --watch",
        build: "tsup"
      },
      bin: {
        island: "bin/island.js"
      },
      keywords: [],
      author: "",
      license: "ISC",
      devDependencies: {
        "@types/fs-extra": "^11.0.1",
        "@types/node": "^18.11.9",
        rollup: "^3.12.1",
        tsup: "^6.5.0",
        typescript: "^4.9.3"
      },
      dependencies: {
        "@vitejs/plugin-react": "^2.2.0",
        cac: "^6.7.14",
        "fs-extra": "^11.1.0",
        ora: "^6.1.2",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        vite: "^3.2.4"
      }
    };
  }
});

// node_modules/.pnpm/registry.npmmirror.com+tsup@6.5.0_typescript@4.9.3/node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from "url";
import path from "path";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// src/node/cli.ts
import { cac } from "cac";

// src/node/dev.ts
import { createServer as createViteDevServer } from "vite";
import pluginReact from "@vitejs/plugin-react";

// src/node/plugin-island/indexHtml.ts
import { readFile } from "fs/promises";

// src/node/constants/index.ts
import { join } from "path";
var PACKAGE_ROOT = join(__dirname, "..");
var DEFAULT_HTML_PATH = join(PACKAGE_ROOT, "template.html");
var CLIENT_ECTRY_PATH = join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "client-entry.tsx"
);
var SERVER_ECTRY_PATH = join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "ssr-entry.tsx"
);

// src/node/plugin-island/indexHtml.ts
function pluginIndexHtml() {
  return {
    name: "island:index-html",
    apply: "serve",
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              type: "module",
              src: `@fs/${CLIENT_ECTRY_PATH}`
            },
            injectTo: "body"
          }
        ]
      };
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          let html = await readFile(DEFAULT_HTML_PATH, "utf-8");
          try {
            html = await server.transformIndexHtml(
              req.url,
              html,
              req.originalUrl
            );
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
          } catch (e) {
            return next(e);
          }
        });
      };
    }
  };
}

// src/node/dev.ts
async function createDevServer(root = process.cwd()) {
  return createViteDevServer({
    root,
    plugins: [pluginIndexHtml(), pluginReact()]
  });
}

// src/node/build.ts
import { build as viteBuild } from "vite";
import { join as join2 } from "path";
import fs from "fs-extra";
import pluginReact2 from "@vitejs/plugin-react";
import ora from "ora";
async function bundle(root) {
  console.log(__dirname);
  const resolveViteConfig = (isServer) => {
    return {
      mode: "production",
      root,
      build: {
        outDir: isServer ? ".temp" : "build",
        ssr: isServer,
        rollupOptions: {
          input: isServer ? SERVER_ECTRY_PATH : CLIENT_ECTRY_PATH,
          output: {
            format: isServer ? "cjs" : "esm"
          }
        }
      },
      plugins: [pluginReact2()]
    };
  };
  try {
    const clientBuild = async () => {
      return viteBuild(resolveViteConfig(false));
    };
    const serverBuild = async () => {
      return viteBuild(resolveViteConfig(true));
    };
    const spinner = ora();
    spinner.start("Building client + server bundles...");
    const [clientBundle, serverBundle] = await Promise.all([
      clientBuild(),
      serverBuild()
    ]);
    spinner.stop();
    return [clientBundle, serverBundle];
  } catch (e) {
    console.log(e);
  }
}
async function renderPage(render, root, clientBuild) {
  const appHtml = render();
  const clientBuildChunk = clientBuild.output.find(
    (chunk) => chunk.type === "chunk" && chunk.isEntry
  );
  const html = `
  <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>

    <body>
        <div id="root">${appHtml}</div>
        <script src='./${clientBuildChunk.fileName}' type='module'><\/script>
    </body>

    </html>
  `.trim();
  await fs.writeFile(join2(root, "build", "index.html"), html);
  await fs.remove(join2(root, ".temp"));
}
async function build(root) {
  const [clientBundle, serverBundle] = await bundle(root);
  const serverEntryPath = join2(root, ".temp", "ssr-entry.js");
  const { render } = await import(serverEntryPath);
  await renderPage(render, root, clientBundle);
}

// src/node/cli.ts
var path2 = __require("path");
var version = require_package().version;
var cli = cac("island").version(version).help();
cli.command("[root]", "start dev server").alias("dev").action(async (root) => {
  root = root ? path2.resolve(root) : process.cwd();
  const server = await createDevServer(root);
  await server.listen();
  server.printUrls();
});
cli.command("[root]", "build for production").alias("build").action(async (root) => {
  root = root ? path2.resolve(root) : process.cwd();
  await build(root);
});
cli.parse();
