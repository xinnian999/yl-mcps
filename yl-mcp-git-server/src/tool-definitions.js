/**
 * MCP 工具定义
 */
export const TOOL_DEFINITIONS = [
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
    name: 'git_fetch',
    description: '同步远程仓库信息（git fetch）',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'git_checkout',
    description: '切换到指定分支（git checkout）',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: '要切换到的分支名称',
        },
      },
      required: ['branch'],
    },
  },
  {
    name: 'git_branch_info',
    description: '查看分支跟踪关系（git branch -vv）',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'git_smart_checkout',
    description: '智能切换分支：自动同步远程并切换到指定分支（自动处理本地分支创建和跟踪）',
    inputSchema: {
      type: 'object',
      properties: {
        branch_number: {
          type: 'string',
          description: '分支名称（完整的分支名称）',
        },
      },
      required: ['branch_number'],
    },
  },
];
