---
description: 智能分支切换工作流
auto_execution_mode: 1
---

# 智能分支切换工作流

这个工作流通过组合多个 `git_command` 调用来实现智能分支切换功能

## 参数说明

此工作流需要提供以下参数：
- **branch_name**: 要切换到的分支名称（完整的分支名称）
- **remote**: 远程仓库名称（可选，默认为 `origin`）

## 使用示例

```javascript
// 使用默认远程仓库 origin
{
  "tool": "smart_checkout",
  "arguments": {
    "branch_name": "feature/new-feature"
  }
}

// 指定其他远程仓库
{
  "tool": "smart_checkout",
  "arguments": {
    "branch_name": "feature/new-feature",
    "remote": "upstream"
  }
}
```

## 工作流步骤

### 1. 同步远程分支信息
// turbo
首先从指定的远程仓库（默认为 origin）获取最新的分支信息：

```bash
git fetch [remote]
```

如果未指定 remote 参数，则使用：
```bash
git fetch origin
```

### 2. 检查分支是否存在
// turbo
检查本地和远程分支列表，确认目标分支是否存在：

```bash
git branch -a
```

### 3. 切换到目标分支
// turbo
切换到指定的分支，Git 会自动处理远程分支跟踪：

```bash
git checkout [branch_name]
```

如果分支不存在于本地但存在于远程，Git 会自动创建本地分支并设置跟踪关系。

### 4. 验证切换结果
// turbo
确认当前所在的分支：

```bash
git branch --show-current
```

## 使用说明

1. **远程仓库**: 可以指定远程仓库名称，默认使用 `origin`
2. **自动同步**: 工作流会先同步远程分支信息，确保能看到最新的远程分支
3. **智能切换**: Git 会自动处理本地分支创建和远程跟踪设置
4. **状态验证**: 切换后会验证当前分支，确保操作成功

## 优势

- **模块化**: 每个步骤都是独立的Git命令，易于理解和调试
- **灵活性**: 可以根据需要调整或跳过某些步骤
- **透明性**: 用户可以清楚看到每个执行的Git命令
- **安全性**: 利用现有的Git命令安全验证机制
- **自动化**: Git 自动处理本地分支创建和远程跟踪

## 注意事项

- 确保在正确的Git仓库目录中执行
- 如果本地有未提交的更改，可能需要先提交或暂存
- 分支名称必须是完整的分支名称（如 `feature/new-feature`）
- 如果切换失败，工作流会停止并提供错误信息
