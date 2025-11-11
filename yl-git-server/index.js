#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（mcp-git-server 的上级目录）
const PROJECT_ROOT = path.resolve(__dirname, '..');

class GitMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'git-auto-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'git_init',
          description: '初始化 git 仓库,可选择性添加远程仓库地址',
          inputSchema: {
            type: 'object',
            properties: {
              remote_url: {
                type: 'string',
                description: '远程仓库地址 (可选),例如: git@github.com:username/repo.git',
              },
              branch: {
                type: 'string',
                description: '默认分支名称 (可选,默认为 main)',
                default: 'main',
              },
            },
          },
        },
        {
          name: 'git_status',
          description: '查看 git 状态',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'git_diff',
          description: '查看当前的改动内容（git diff 和 git diff --cached），用于生成 commit 信息',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'git_add',
          description: '添加文件到暂存区（git add）',
          inputSchema: {
            type: 'object',
            properties: {
              files: {
                type: 'string',
                description: '要添加的文件路径，使用 "." 添加所有文件，或指定具体文件路径',
                default: '.',
              },
            },
          },
        },
        {
          name: 'git_smart_commit',
          description: '智能提交：先读取改动内容，AI 生成合适的 commit 信息后再提交并推送',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'AI 生成的 commit 信息',
              },
            },
            required: ['message'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'git_init') {
        const remoteUrl = request.params.arguments?.remote_url;
        const branch = request.params.arguments?.branch || 'main';
        
        try {
          let result = '';
          
          // 初始化 git 仓库
          const initResult = execSync('git init', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });
          result += `✅ Git 仓库初始化成功\n${initResult}\n`;
          
          // 设置默认分支名称
          try {
            execSync(`git branch -M ${branch}`, {
              cwd: PROJECT_ROOT,
              encoding: 'utf-8',
            });
            result += `✅ 默认分支设置为: ${branch}\n`;
          } catch (e) {
            // 如果没有提交,branch -M 会失败,这是正常的
            result += `ℹ️  默认分支将在首次提交后设置为: ${branch}\n`;
          }
          
          // 如果提供了远程仓库地址,添加 remote
          if (remoteUrl) {
            try {
              execSync(`git remote add origin ${remoteUrl}`, {
                cwd: PROJECT_ROOT,
                encoding: 'utf-8',
              });
              result += `✅ 远程仓库已添加: ${remoteUrl}\n`;
            } catch (e) {
              result += `⚠️  添加远程仓库失败: ${e.message}\n`;
            }
          }
          
          // 检测并创建 .gitignore 文件
          const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
          if (!fs.existsSync(gitignorePath)) {
            const gitignoreContent = `# Dependencies
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
            fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
            result += `✅ 已创建 .gitignore 文件\n`;
          } else {
            result += `ℹ️  .gitignore 文件已存在，跳过创建\n`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Git 初始化失败：\n${error.message}\n${error.stderr || ''}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'git_status') {
        try {
          const statusResult = execSync('git status', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });

          return {
            content: [
              {
                type: 'text',
                text: statusResult,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 获取 git 状态失败：\n${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'git_diff') {
        try {
          // 获取未暂存的改动
          let unstagedDiff = '';
          try {
            unstagedDiff = execSync('git diff', {
              cwd: PROJECT_ROOT,
              encoding: 'utf-8',
            });
          } catch (e) {
            // 可能没有未暂存的改动
          }

          // 获取已暂存的改动
          let stagedDiff = '';
          try {
            stagedDiff = execSync('git diff --cached', {
              cwd: PROJECT_ROOT,
              encoding: 'utf-8',
            });
          } catch (e) {
            // 可能没有已暂存的改动
          }

          // 获取状态信息
          const statusResult = execSync('git status --short', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });

          let result = '📊 Git 改动概览：\n\n';
          result += `${statusResult}\n`;
          
          if (stagedDiff) {
            result += '\n📝 已暂存的改动 (git diff --cached)：\n';
            result += '```diff\n' + stagedDiff + '\n```\n';
          }
          
          if (unstagedDiff) {
            result += '\n📝 未暂存的改动 (git diff)：\n';
            result += '```diff\n' + unstagedDiff + '\n```\n';
          }

          if (!stagedDiff && !unstagedDiff) {
            result += '\n✅ 没有检测到改动';
          }

          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 获取 git diff 失败：\n${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'git_add') {
        const files = request.params.arguments?.files || '.';
        
        try {
          const addResult = execSync(`git add ${files}`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });

          // 获取添加后的状态
          const statusResult = execSync('git status --short', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });

          return {
            content: [
              {
                type: 'text',
                text: `✅ 文件已添加到暂存区: ${files}\n\n📊 当前状态：\n${statusResult}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 添加文件失败：\n${error.message}\n${error.stderr || ''}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'git_smart_commit') {
        const message = request.params.arguments?.message;
        
        if (!message) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ 请提供 commit 信息',
              },
            ],
            isError: true,
          };
        }

        try {
          // 执行 git add .
          execSync('git add .', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });

          // 执行 git commit
          const commitResult = execSync(`git commit -m "${message}"`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
          });

          // 执行 git push，如果失败则尝试设置上游分支
          let pushResult = '';
          try {
            pushResult = execSync('git push', {
              cwd: PROJECT_ROOT,
              encoding: 'utf-8',
            });
          } catch (pushError) {
            // 检查是否是因为没有设置上游分支
            if (pushError.message.includes('no upstream branch')) {
              // 获取当前分支名
              const currentBranch = execSync('git branch --show-current', {
                cwd: PROJECT_ROOT,
                encoding: 'utf-8',
              }).trim();
              
              // 设置上游分支并推送
              pushResult = execSync(`git push --set-upstream origin ${currentBranch}`, {
                cwd: PROJECT_ROOT,
                encoding: 'utf-8',
              });
              pushResult = `✅ 已自动设置上游分支: origin/${currentBranch}\n${pushResult}`;
            } else {
              // 其他推送错误，直接抛出
              throw pushError;
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: `✅ 智能提交成功！\n\n📝 Commit: ${message}\n\n${commitResult}\n${pushResult}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 智能提交失败：\n${error.message}\n${error.stderr || ''}`,
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git MCP server running on stdio');
  }
}

const server = new GitMCPServer();
server.run().catch(console.error);
