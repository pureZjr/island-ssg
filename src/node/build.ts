import { build as viteBuild, type InlineConfig } from 'vite';
import { CLIENT_ECTRY_PATH, SERVER_ECTRY_PATH } from './constants';
import { join } from 'path';
import { type RollupOutput } from 'rollup';
import fs from 'fs-extra';
import pluginReact from '@vitejs/plugin-react';
import ora from 'ora';

export async function bundle(root: string) {
  console.log(__dirname);
  const resolveViteConfig = (isServer: boolean): InlineConfig => {
    return {
      mode: 'production',
      root,
      build: {
        outDir: isServer ? '.temp' : 'build',
        ssr: isServer,
        rollupOptions: {
          input: isServer ? SERVER_ECTRY_PATH : CLIENT_ECTRY_PATH,
          output: {
            format: isServer ? 'cjs' : 'esm'
          }
        }
      },
      plugins: [pluginReact()]
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
    spinner.start('Building client + server bundles...');
    const [clientBundle, serverBundle] = await Promise.all([
      clientBuild(),
      serverBuild()
    ]);
    spinner.stop();
    return [clientBundle, serverBundle] as [RollupOutput, RollupOutput];
  } catch (e) {
    console.log(e);
  }
}

export async function renderPage(
  render: () => string,
  root: string,
  clientBuild: RollupOutput
) {
  const appHtml = render();
  const clientBuildChunk = clientBuild.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry
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
        <script src='./${clientBuildChunk.fileName}' type='module'></script>
    </body>

    </html>
  `.trim();
  await fs.writeFile(join(root, 'build', 'index.html'), html);
  await fs.remove(join(root, '.temp'));
}

export default async function build(root: string) {
  // 1.bundle - client 端 + server 端
  const [clientBundle] = await bundle(root);
  // 2.引入 server-entry 模块
  const serverEntryPath = join(root, '.temp', 'ssr-entry.js');
  // 3.服务端渲染，产出 HTML
  const { render } = await import(serverEntryPath);

  await renderPage(render, root, clientBundle as RollupOutput);
}
