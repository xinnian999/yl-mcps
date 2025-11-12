# YL MCP Git Server

[![npm version](https://badge.fury.io/js/yl-mcp-git-server.svg)](https://badge.fury.io/js/yl-mcp-git-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个基于 MCP (Model Context Protocol) 的 Git 操作服务器，提供智能化的 Git 工作流自动化功能。通过与 AI 助手集成，实现代码变更的智能分析和自动化 Git 操作。

## 功能特性

- 🚀 **智能提交**: AI 自动分析代码变更并生成规范的 commit 信息
- 📊 **状态查看**: 快速查看 Git 仓库状态和变更内容
- 🔧 **自动化操作**: 一键完成 add、commit、push 流程
- 🎯 **仓库初始化**: 支持快速初始化 Git 仓库并配置远程地址

## 快速开始

### 安装

#### 方式一：通过 npx 使用（推荐）

无需安装，直接在 Windsurf 或其他支持 MCP 的 AI 客户端中配置（**注意**：必须添加 `-y` 参数）：

```json
{
  "mcpServers": {
    "yl-git-server": {
      "command": "npx",
      "args": ["-y", "yl-mcp-git-server"]
    }
  }
}
```

#### 方式二：全局安装

```bash
npm install -g yl-mcp-git-server
```

然后在配置中使用：

```json
{
  "mcpServers": {
    "yl-git-server": {
      "command": "yl-mcp-git-server"
    }
  }
}
```

#### 方式三：本地开发

```bash
git clone <repository-url>
cd yl-git-server
npm install
```

在 AI 客户端中配置：

```json
{
  "mcpServers": {
    "yl-git-server": {
      "command": "node",
      "args": ["/path/to/yl-git-server/src/index.js"]
    }
  }
}
```

### 配置步骤（以 Windsurf 为例）

1. 打开 Windsurf 设置 (`⌘ + ,` 或 `Ctrl + ,`)
2. 找到 "MCP Servers" 配置项
3. 添加上述配置
4. 重启 Windsurf
5. 现在可以与 AI 助手对话使用 Git 功能了

## 功能说明

### 🛠️ 可用工具

| 工具名称 | 功能描述 | 参数 |
|---------|---------|------|
| `git_init` | 初始化 Git 仓库 | `remote_url` (可选), `branch` (可选) |
| `git_status` | 查看仓库状态 | 无 |
| `git_diff` | 查看代码变更 | 无 |
| `git_add` | 添加文件到暂存区 | `files` (可选，默认 ".") |
| `git_smart_commit` | 智能提交并推送 | `message` (必填) |
| `debug_info` | 获取调试信息和系统状态 | `include_logs` (可选), `log_lines` (可选) |
| `debug_clear_logs` | 清理调试日志文件 | 无 |

### 📝 使用示例

#### 初始化仓库
```
"帮我初始化一个 Git 仓库，远程地址是 git@github.com:username/repo.git"
```

#### 查看状态和变更
```
"查看当前 Git 状态"
"显示我的代码改动"
```

#### 智能提交
```
"帮我智能提交代码"
"分析我的改动并自动提交"
```

#### 添加文件
```
"添加所有文件到暂存区"
"只添加 src/ 目录下的文件"
```

## 🚀 智能提交工作流

### 自动化流程

1. **触发**：对 AI 说 "帮我智能提交代码"
2. **分析**：AI 自动调用 `git_diff` 查看代码变更
3. **生成**：AI 分析改动内容，生成符合规范的 commit 信息
4. **提交**：AI 调用 `git_smart_commit` 完成提交和推送

### Commit 信息规范

生成的 commit 信息遵循约定式提交规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

### 示例对话

```
用户："我修改了登录功能，帮我提交代码"
AI："我来帮你分析代码变更并智能提交..."
     [自动生成] feat(auth): 优化登录验证逻辑和错误处理
     [自动提交并推送]
```

## 项目结构

```
yl-git-server/
├── src/
│   ├── index.js           # 服务器入口文件
│   ├── server.js          # MCP 服务器实现
│   ├── config.js          # 服务器配置
│   ├── tool-definitions.js # 工具定义
│   └── tool-handlers.js   # 工具处理器
├── package.json
└── README.md
```

## 开发

### 启动服务器
```bash
npm start
```

### 测试服务器
```bash
npm test
```

## 依赖

- `@modelcontextprotocol/sdk`: MCP SDK 用于构建 MCP 服务器

## 📋 系统要求

- Node.js >= 16.0.0
- Git >= 2.0.0
- 支持 MCP 的 AI 客户端（如 Windsurf、Claude Desktop 等）

## 🔧 故障排除

### 常见问题

**Q: MCP 服务器无法启动**
A: 检查 Node.js 版本，确保 >= 16.0.0

**Q: npx 连接失败或卡住**
A: 确保在 npx 命令中添加 `-y` 参数，如 `["npx", "-y", "yl-mcp-git-server"]`，这样可以自动确认包的安装而不需要交互式确认

**Q: Git 命令执行失败或找不到 .git 目录**
A: 确保当前目录是 Git 仓库，且有适当的权限。v1.0.1+ 版本已修复通过 npx 调用时工作目录不正确的问题

**Q: 推送失败**
A: 检查 Git 远程仓库配置和认证信息

### 🐛 调试和故障排除

#### 启用调试模式

**方式一：通过环境变量**
```bash
# 基础调试模式
DEBUG=true npx -y yl-mcp-git-server

# 详细调试模式
DEBUG=true LOG_LEVEL=debug npx -y yl-mcp-git-server

# 自定义日志文件
DEBUG=true LOG_FILE=/path/to/custom.log npx -y yl-mcp-git-server
```

**方式二：在 MCP 客户端配置中启用**
```json
{
  "mcpServers": {
    "yl-git-server": {
      "command": "npx",
      "args": ["-y", "yl-mcp-git-server"],
      "env": {
        "DEBUG": "true",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### 调试工具

服务器内置了调试工具，可以通过 AI 助手调用：

| 工具名称 | 功能描述 | 使用方法 |
|---------|---------|---------|
| `debug_info` | 获取系统状态和调试信息 | "显示调试信息" |
| `debug_clear_logs` | 清理调试日志文件 | "清理调试日志" |

**示例对话**：
```
用户："显示调试信息"
AI：[调用 debug_info 工具，显示系统状态、Git 状态、内存使用等]

用户："清理调试日志"  
AI：[调用 debug_clear_logs 工具，清理日志文件]
```

#### 本地调试助手

项目包含一个调试助手脚本，用于本地故障排除：

```bash
# 下载项目到本地
git clone <your-repo-url>
cd yl-mcp-git-server

# 使用调试助手
node debug-helper.js help          # 显示帮助
node debug-helper.js status        # 显示系统状态
node debug-helper.js logs          # 显示最近日志
node debug-helper.js clear-logs    # 清理日志
node debug-helper.js check-deps    # 检查依赖
node debug-helper.js test-tools    # 测试工具功能
```

#### 日志文件

调试模式下，所有操作都会记录到日志文件：
- **默认位置**: `./debug.log`
- **自定义位置**: 通过 `LOG_FILE` 环境变量设置
- **日志格式**: JSON 格式，包含时间戳、级别、消息和详细数据

#### 常见调试场景

**1. 连接问题**
```bash
# 检查服务器是否正常启动
DEBUG=true npx -y yl-mcp-git-server

# 查看连接日志
node debug-helper.js logs | grep -i "connect"
```

**2. 工具调用失败**
```bash
# 启用详细日志
DEBUG=true LOG_LEVEL=debug npx -y yl-mcp-git-server

# 查看工具调用日志
node debug-helper.js logs | grep -i "tool"
```

**3. Git 操作问题**
```bash
# 检查 Git 状态
node debug-helper.js status

# 查看 Git 相关错误
node debug-helper.js logs | grep -i "git"
```

**4. 内存或性能问题**
```bash
# 查看系统资源使用
node debug-helper.js status

# 监控内存使用
watch -n 5 'node debug-helper.js status | grep "内存使用"'
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/yl-mcp-git-server/issues)
- 📖 文档: [项目文档](https://github.com/yourusername/yl-mcp-git-server)

## 🔗 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Windsurf IDE](https://codeium.com/windsurf)
- [npm 包页面](https://www.npmjs.com/package/yl-mcp-git-server)

---

**版本**: 1.0.1 | **更新时间**: 2025-11-12
