# YL MCP Servers

[![npm version](https://badge.fury.io/js/yl-mcp-git-server.svg)](https://badge.fury.io/js/yl-mcp-git-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个 MCP (Model Context Protocol) 服务器集合，为 AI 助手提供各种实用工具。通过与 Windsurf、Claude Desktop 等 AI 客户端集成，实现智能化的工作流自动化。

## 📦 包含的服务器

### 💻 yl-mcp-git-server

一个基于 MCP 的智能 Git 操作服务器，已发布到 npm，可直接通过 npx 使用。

**✨ 主要功能：**
- 🚀 **智能提交**: AI 自动分析代码变更并生成规范的 commit 信息
- 📊 **状态查看**: 快速查看 Git 仓库状态和变更内容
- 🔧 **自动化操作**: 一键完成 add、commit、push 流程
- 🎯 **仓库初始化**: 支持快速初始化 Git 仓库并配置远程地址

**📦 安装方式：**
```bash
# 通过 npx 直接使用（推荐）
npx -y yl-mcp-git-server

# 或全局安装
npm install -g yl-mcp-git-server
```

[📄 查看详细文档](./yl-git-server/README.md) | [📦 npm 包页面](https://www.npmjs.com/package/yl-mcp-git-server)

## 🚀 快速开始

### 方式一：通过 npx 使用（推荐）

无需安装，直接在 AI 客户端中配置：

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

### 方式二：全局安装

```bash
npm install -g yl-mcp-git-server
```

然后配置：
```json
{
  "mcpServers": {
    "yl-git-server": {
      "command": "yl-mcp-git-server"
    }
  }
}
```

### 方式三：本地开发

```bash
git clone <repository-url>
cd yl-git-server
npm install
```

配置：
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

### 📋 配置步骤（以 Windsurf 为例）

1. 打开 Windsurf 设置 (`⌘ + ,` 或 `Ctrl + ,`)
2. 找到 "MCP Servers" 配置项
3. 添加上述配置
4. 重启 Windsurf
5. 现在可以与 AI 助手对话使用 Git 功能了

### ✨ 开始使用

配置完成后，在 AI 客户端中即可使用：

```
帮我智能提交代码
```

AI 会自动分析你的代码改动，生成符合规范的 commit 信息并完成提交。

## 📝 使用示例

### 🚀 智能提交代码
```
"帮我智能提交代码"
"分析我的改动并自动提交"
```

### 📊 查看 Git 状态
```
"查看当前 Git 状态"
"显示我的代码改动"
```

### 🎯 初始化仓库
```
"初始化一个新的 Git 仓库，远程地址为 git@github.com:username/repo.git"
```

### 📂 添加文件
```
"添加所有文件到暂存区"
"只添加 src/ 目录下的文件"
```

### 🔄 完整工作流示例
```
用户："我修改了登录功能，帮我提交代码"
AI：  "我来帮你分析代码变更并智能提交..."
      [自动生成] feat(auth): 优化登录验证逻辑和错误处理
      [自动提交并推送]
```

## 🛠️ 开发

### 测试服务器

```bash
cd yl-git-server
npm test
```

### 启动服务器

```bash
npm start
```

## 📁 项目结构

```
yl-mcps/
├── yl-git-server/          # Git 操作 MCP 服务器
│   ├── src/
│   │   ├── index.js        # 服务器入口
│   │   ├── server.js       # MCP 服务器实现
│   │   ├── config.js       # 配置
│   │   ├── tool-definitions.js  # 工具定义
│   │   └── tool-handlers.js     # 工具处理器
│   ├── package.json
│   └── README.md
├── mcp_config.json         # MCP 配置文件
├── MCP_SETUP.md           # MCP 配置指南
└── README.md              # 本文件
```

## 🔧 技术栈

- **Node.js**: 运行环境
- **@modelcontextprotocol/sdk**: MCP SDK
- **ES Modules**: 使用现代 JavaScript 模块系统

## 📋 系统要求

- **Node.js** >= 16.0.0
- **Git** >= 2.0.0
- **AI 客户端**: Windsurf、Claude Desktop 等支持 MCP 的应用

## 🔧 故障排除

### 常见问题

**Q: npx 连接失败或卡住**
A: 确保在 npx 命令中添加 `-y` 参数，如 `["npx", "-y", "yl-mcp-git-server"]`

**Q: MCP 服务器无法启动**
A: 检查 Node.js 版本，确保 >= 16.0.0

**Q: Git 命令执行失败**
A: 确保当前目录是 Git 仓库，且有适当的权限

**Q: npm 权限错误 (EACCES)**
A: 如果遇到类似 "Your cache folder contains root-owned files" 的错误，执行以下命令修复权限：
```bash
sudo chown -R $(id -u):$(id -g) "$HOME/.npm"
```
这通常是由于之前使用 `sudo npm` 命令导致的缓存文件权限问题。

## 📊 版本信息

- **yl-mcp-git-server**: v1.0.0
- **更新时间**: 2025-11-12
- **npm 地址**: https://www.npmjs.com/package/yl-mcp-git-server

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 🔗 相关链接

- [📦 npm 包](https://www.npmjs.com/package/yl-mcp-git-server)
- [📄 详细文档](./yl-git-server/README.md)
- [🌐 Model Context Protocol](https://modelcontextprotocol.io/)
- [💻 Windsurf IDE](https://codeium.com/windsurf)
- [🤖 Claude Desktop](https://claude.ai/)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

⭐ 如果这个项目对你有帮助，请给个 Star！
