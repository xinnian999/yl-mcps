---
description: 智能Git仓库初始化工作流
auto_execution_mode: 1
---

# Git仓库初始化工作流

这个工作流通过组合多个 `git_command` 调用来实现Git仓库初始化功能

## 参数说明

1. **remote_url** (可选): 远程仓库地址
   - 格式: `git@github.com:username/repo.git` 或 `https://github.com/username/repo.git`
   - 如果提供，会自动添加为origin远程仓库

2. **branch** (可选): 默认分支名称
   - 默认值: `main`
   - 常用选项: `main`, `master`, `develop`

## 工作流步骤

### 1. 初始化Git仓库
创建新的Git仓库：

```bash
git init
```

### 2. 设置默认分支名称
// turbo
设置默认分支为指定名称（默认为main）：

```bash
git branch -M [分支名称]
```

### 3. 添加远程仓库（可选）
// turbo
如果提供了远程仓库地址，添加origin远程仓库：

```bash
git remote add origin [远程仓库地址]
```

### 4. 创建.gitignore文件
// turbo
检测并创建标准的.gitignore文件（如果不存在）：

- 检查.gitignore文件是否存在
- 如果不存在，创建包含常用忽略规则的.gitignore文件

## 执行流程

1. **仓库初始化**: 在当前目录创建Git仓库
2. **分支设置**: 设置默认分支名称
3. **远程配置**: 添加远程仓库（如果提供）
4. **文件创建**: 创建标准的.gitignore文件

## 优势

- **模块化**: 每个步骤都是独立的Git命令，易于理解和调试
- **灵活性**: 可以选择性地提供参数
- **标准化**: 自动创建标准的.gitignore文件
- **透明性**: 用户可以清楚看到每个执行的Git命令
- **安全性**: 利用现有的Git命令安全验证机制

## 注意事项

- 确保在要初始化为Git仓库的目录中执行
- 如果目录已经是Git仓库，初始化命令会被忽略
- 远程仓库地址必须是有效的Git仓库URL
- 确保有权限访问指定的远程仓库

## 错误处理

- **目录权限**: 如果没有写权限，会提示错误
- **远程仓库**: 如果远程仓库地址无效，会显示警告但不影响本地初始化
- **分支设置**: 如果分支设置失败，会在首次提交时自动设置

## .gitignore模板

工作流会自动创建包含以下内容的.gitignore文件：

```
# 依赖文件
node_modules/
*.log
npm-debug.log*

# 构建输出
dist/
build/
*.tgz

# 环境配置
.env
.env.local
.env.*.local

# IDE文件
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db
```