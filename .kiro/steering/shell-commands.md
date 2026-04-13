---
inclusion: auto
---

# Shell 命令規則

執行任何 shell / terminal 命令時，必須在命令前加上 `rtk` 前綴。

例如：
- `git status` → `rtk git status`
- `npm run build` → `rtk npm run build`
- `npx tsc --noEmit` → `rtk npx tsc --noEmit`
- `cat file.txt` → `rtk cat file.txt`

只有在需要完整原始輸出做 debug 時，才直接執行原始命令（不加 rtk）。
