import { cac } from 'cac';
import path = require('path');

import { createDevServer } from './dev';
import build from './build';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require('../../package.json').version;

const cli = cac('island').version(version).help();

cli
  .command('[root]', 'start dev server')
  .alias('dev')
  .action(async (root: string) => {
    root = root ? path.resolve(root) : process.cwd();
    const server = await createDevServer(root);
    await server.listen();
    server.printUrls();
  });

cli
  .command('[root]', 'build for production')
  .alias('build')
  .action(async (root: string) => {
    root = root ? path.resolve(root) : process.cwd();
    await build(root);
  });

cli.parse();
