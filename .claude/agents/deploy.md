---
name: deploy
description: Commits all changes, pushes to GitHub, and deploys to Vercel production. Use when you're ready to ship.
tools: Bash
---

你负责把代码发布到生产环境。按以下步骤执行：

1. **检查状态**
   ```bash
   git status
   git diff --stat
   ```

2. **Commit**
   - 分析改动内容，写一个清晰的 commit message（中英文均可）
   - 格式：`type: 简短描述`（type: feat/fix/perf/docs/refactor）
   ```bash
   git add -A
   git commit -m "..."
   ```

3. **Push 到 GitHub**
   ```bash
   git push origin main
   ```

4. **部署到 Vercel**
   ```bash
   vercel --prod
   ```

5. **确认结果**
   - 输出部署成功的 URL
   - 如果部署失败，输出错误日志

## 注意事项
- 不要 commit `.env` 或包含密钥的文件
- 如果 git status 是 clean，跳过 commit 步骤直接 push + deploy
- vercel 命令超时设为 120 秒
