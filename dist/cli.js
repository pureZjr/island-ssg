"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var __getOwnPropNames = Object.getOwnPropertyNames;
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

// src/node/cli.ts
var _cac = require('cac');

// src/node/dev.ts
var _vite = require('vite');
var _pluginreact = require('@vitejs/plugin-react'); var _pluginreact2 = _interopRequireDefault(_pluginreact);

// src/node/plugin-island/indexHtml.ts
var _promises = require('fs/promises');

// src/node/constants/index.ts
var _path = require('path');
var PACKAGE_ROOT = _path.join.call(void 0, __dirname, "..");
var DEFAULT_HTML_PATH = _path.join.call(void 0, PACKAGE_ROOT, "template.html");
var CLIENT_ECTRY_PATH = _path.join.call(void 0, 
  PACKAGE_ROOT,
  "src",
  "runtime",
  "client-entry.tsx"
);
var SERVER_ECTRY_PATH = _path.join.call(void 0, 
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
          let html = await _promises.readFile.call(void 0, DEFAULT_HTML_PATH, "utf-8");
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
  return _vite.createServer.call(void 0, {
    root,
    plugins: [pluginIndexHtml(), _pluginreact2.default.call(void 0, )]
  });
}

// src/node/build.ts


var _fsextra = require('fs-extra'); var _fsextra2 = _interopRequireDefault(_fsextra);

var _ora = require('ora'); var _ora2 = _interopRequireDefault(_ora);
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
      plugins: [_pluginreact2.default.call(void 0, )]
    };
  };
  try {
    const clientBuild = async () => {
      return _vite.build.call(void 0, resolveViteConfig(false));
    };
    const serverBuild = async () => {
      return _vite.build.call(void 0, resolveViteConfig(true));
    };
    const spinner = _ora2.default.call(void 0, );
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
  await _fsextra2.default.writeFile(_path.join.call(void 0, root, "build", "index.html"), html);
  await _fsextra2.default.remove(_path.join.call(void 0, root, ".temp"));
}
async function build(root) {
  const [clientBundle, serverBundle] = await bundle(root);
  const serverEntryPath = _path.join.call(void 0, root, ".temp", "ssr-entry.js");
  const { render } = await Promise.resolve().then(() => require(serverEntryPath));
  await renderPage(render, root, clientBundle);
}

// src/node/cli.ts
var path = __require("path");
var version = require_package().version;
var cli = _cac.cac.call(void 0, "island").version(version).help();
cli.command("[root]", "start dev server").alias("dev").action(async (root) => {
  root = root ? path.resolve(root) : process.cwd();
  const server = await createDevServer(root);
  await server.listen();
  server.printUrls();
});
cli.command("[root]", "build for production").alias("build").action(async (root) => {
  root = root ? path.resolve(root) : process.cwd();
  await build(root);
});
cli.parse();
