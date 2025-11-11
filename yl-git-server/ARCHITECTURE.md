# 代码架构说明

## 目录结构

```
yl-git-server/
├── src/
│   ├── index.js              # 入口文件
│   ├── server.js             # MCP 服务器主类
│   ├── config.js             # 配置和常量
│   ├── tool-definitions.js   # 工具定义
│   ├── tool-handlers.js      # 工具处理器
│   └── git-commands.js       # Git 命令执行逻辑
├── package.json
├── README.md
└── index.js.backup           # 旧版本备份
```

## 模块职责

### 1. `src/index.js`
- **职责**: 应用入口
- **功能**: 创建并启动 MCP 服务器实例

### 2. `src/server.js`
- **职责**: MCP 服务器核心
- **功能**: 
  - 初始化 MCP Server
  - 注册请求处理器
  - 错误处理和生命周期管理

### 3. `src/config.js`
- **职责**: 配置管理
- **功能**:
  - 项目根目录配置
  - 服务器配置
  - .gitignore 模板

### 4. `src/tool-definitions.js`
- **职责**: 工具定义
- **功能**: 定义所有 MCP 工具的 schema

### 5. `src/tool-handlers.js`
- **职责**: 工具处理逻辑
- **功能**:
  - 处理工具调用请求
  - 统一响应格式
  - 错误处理

### 6. `src/git-commands.js`
- **职责**: Git 命令执行
- **功能**:
  - 封装所有 git 命令
  - 处理命令执行和错误

## 优势

1. **关注点分离**: 每个模块职责单一，易于理解和维护
2. **易于测试**: 各模块独立，可以单独进行单元测试
3. **易于扩展**: 添加新工具只需修改对应模块
4. **代码复用**: Git 命令逻辑可以在多个处理器中复用
5. **配置集中**: 所有配置统一管理，易于修改

## 如何添加新工具

1. 在 `tool-definitions.js` 中添加工具定义
2. 在 `git-commands.js` 中实现 git 命令逻辑
3. 在 `tool-handlers.js` 中添加处理器
4. 无需修改其他文件

## 迁移说明

- 旧版本已备份为 `index.js.backup`
- 新版本功能完全兼容旧版本
- 入口文件已更新为 `src/index.js`
