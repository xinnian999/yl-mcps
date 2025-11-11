import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（yl-git-server 的上级目录）
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const SERVER_CONFIG = {
  name: 'git-auto-server',
  version: '1.0.0',
};

export const GITIGNORE_TEMPLATE = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build output
dist/
build/
*.log

# Testing
coverage/
.nyc_output/
`;
