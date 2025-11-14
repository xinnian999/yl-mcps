/**
 * MCP 工具定义
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'set_working_dir',
    description: '设置 Git 操作的工作目录',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '要设置的工作目录路径',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'git_command',
    description: '通用 Git 命令执行器：安全地执行各种 git 命令，具有命令白名单和危险命令禁止机制',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '要执行的 git 命令（不需要包含 "git" 前缀），例如：status, log --oneline -10, branch -a',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'get_chrome_cookies',
    description: '获取 Chrome 浏览器中指定网站的所有 cookies',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: '要获取 cookies 的域名，例如：google.com 或 github.com',
        },
        profile: {
          type: 'string',
          description: 'Chrome 用户配置文件名称（可选），默认为 Default',
        },
      },
      required: ['domain'],
    },
  }
];
