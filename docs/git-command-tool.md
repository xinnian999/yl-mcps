# 通用 Git 命令工具使用指南

## 概述

通用 Git 命令工具（`git_command`）是一个安全的 Git 命令执行器，允许 AI 安全地执行各种 Git 命令，同时提供多层安全保护机制。

## 安全机制

### 1. 命令白名单
只允许执行预定义的安全 Git 命令：
- **查询命令**：status, diff, log, show, branch, tag, remote, ls-files, ls-remote, describe, reflog, blame, grep, shortlog
- **修改命令**：add, commit, checkout, switch, merge, rebase, fetch, pull, push, stash, cherry-pick, revert
- **管理命令**：init, clone, config, reset

### 2. 危险命令检测
自动检测并直接禁止以下危险模式：
- `--force` 强制参数
- `--hard` 硬重置参数
- `rm` 删除命令
- `clean -df` 清理命令
- `filter-branch` 历史重写
- `gc --aggressive` 激进垃圾回收
- `branch -D` 强制删除分支
- `tag -d` 删除标签

## 使用方法

### 基本语法
```json
{
  "command": "git命令（不包含git前缀）"
}
```

### 使用示例

#### 1. 查询命令（完全安全）
```json
// 查看状态
{ "command": "status" }

// 查看提交历史
{ "command": "log --oneline -10" }

// 查看所有分支
{ "command": "branch -a" }

// 查看差异
{ "command": "diff HEAD~1" }
```

#### 2. 修改命令（需谨慎）
```json
// 添加文件
{ "command": "add ." }

// 提交更改
{ "command": "commit -m '修复bug'" }

// 切换分支
{ "command": "checkout main" }

// 拉取更新
{ "command": "pull origin main" }
```

#### 3. 被禁止的危险命令
以下命令会被直接拒绝执行：
```json
// 硬重置（被禁止）
{ "command": "reset --hard HEAD~1" }  // ❌ 会返回错误

// 强制推送（被禁止）
{ "command": "push origin main --force" }  // ❌ 会返回错误

// 强制删除分支（被禁止）
{ "command": "branch -D feature-branch" }  // ❌ 会返回错误
```

## 工具列表

### git_command
执行通用 Git 命令

**参数：**
- `command` (必需)：要执行的 git 命令

### git_command_help
显示帮助信息

**参数：** 无

## 安全提示

1. **只读命令优先**：优先使用查询类命令，这些命令完全安全
2. **谨慎修改**：执行修改类命令前请确认操作的必要性
3. **危险命令禁止**：所有危险命令都被直接禁止，无法执行
4. **工作目录**：确保已通过 `set_working_dir` 设置正确的工作目录

## 错误处理

工具会在以下情况返回错误：
- 命令不在白名单中
- 检测到危险命令模式
- Git 命令执行失败

## 与现有工具的关系

通用 Git 命令工具与现有的专门工具（如 `git_status`、`git_diff` 等）可以并存使用：
- **专门工具**：提供更丰富的输出格式和特定功能
- **通用工具**：提供更大的灵活性，支持更多 Git 命令

## 最佳实践

1. **先查询后操作**：先使用查询命令了解当前状态
2. **小步操作**：将复杂操作分解为多个简单步骤
3. **及时验证**：每次操作后验证结果
4. **备份重要数据**：执行重要操作前确保数据安全

## 示例场景

### 场景1：检查项目状态
```json
{ "command": "status" }
{ "command": "log --oneline -5" }
{ "command": "branch -v" }
```

### 场景2：提交更改
```json
{ "command": "add ." }
{ "command": "status" }
{ "command": "commit -m 'feat: 添加新功能'" }
```

### 场景3：分支操作
```json
{ "command": "branch -a" }
{ "command": "checkout -b feature/new-feature" }
{ "command": "push -u origin feature/new-feature" }
```
