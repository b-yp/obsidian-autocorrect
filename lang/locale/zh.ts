import en from "./en";

const zh: typeof en = {
    // Commands and menus
    "format-content": "格式化当前内容",
    "format-active-note": "格式化当前笔记",
    "no-active-note": "没有可格式化的活动笔记",
    "format-note": "格式化笔记",
    "format-folder": "格式化文件夹下的所有笔记",
    "no-md-in-folder": "该文件夹下未找到 Markdown 文件。",
    "format-success": "格式化成功 🎉",
    "format-failed": "格式化失败: ",

    // Bulk Formatter Modal
    "bulk-title": "Autocorrect 批量格式化工具",
    "bulk-desc": "您即将格式化 {count} 个 Markdown 文件。",
    "bulk-warning-title": "⚠️ 警告",
    "bulk-warning-content": "批量格式化是不可逆的操作，无法通过撤销（Undo）恢复。如果发生错误，您的文件可能会损坏。请务必在运行前完整备份您的 Vault！",
    "bulk-backup-confirm": " 我已完整备份我的笔记库",
    "bulk-cancel": "取消",
    "bulk-start": "开始格式化",
    
    // Progress and results
    "bulk-running": "正在格式化笔记...",
    "bulk-processed": "已处理 {current} / {total} 个文件",
    "bulk-processing": "正在处理: {path}",
    "bulk-stop": "停止",
    "bulk-stopping": "正在停止...",
    "bulk-stopped-title": "格式化已中止",
    "bulk-completed-title": "格式化已完成",
    "bulk-success-count": "成功格式化: {count} 个文件",
    "bulk-fail-count": "失败: {count} 个文件",
    "bulk-fail-list-title": "失败文件列表:",
    "bulk-fail-more": "... 以及另外 {count} 个错误。",
    "bulk-close": "关闭",

    // Settings
    "settings-title": "Autocorrect 格式化器设置",
    "settings-bulk-name": "格式化整个仓库",
    "settings-bulk-desc": "格式化您仓库中的所有 Markdown 笔记。警告：请务必先备份您的文件！",
    "settings-bulk-btn": "格式化全库",
};

export default zh;
