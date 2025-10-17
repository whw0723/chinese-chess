# 中国象棋 Chinese Chess

一个基于 React 的现代化中国象棋游戏，支持双人对战和人机对战，采用专业级 AI 引擎。

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🎮 **双人对战模式** - 支持本地双人对弈
- 🤖 **人机对战模式** - 三种 AI 难度可选（简单/中等/困难）
- 🎯 **专业 AI 引擎** - 基于 XQlightweight 引擎实现
  - 迭代加深搜索
  - Alpha-Beta 剪枝
  - PVS（主变搜索）
  - Null Move 剪枝
  - 置换表优化
  - 历史启发和杀手启发
- 🎨 **现代 UI 设计** - 清新浅色系界面，简洁美观
- ⚡ **高性能** - 使用 Rolldown-Vite 构建，快速响应
- 📱 **响应式布局** - 支持不同屏幕尺寸

## 🎯 AI 难度级别

| 难度 | 搜索深度 | 思考时间 | 棋力水平 |
|------|---------|---------|----------|
| 简单 | 5 层 | ~0.8秒 | 初级 |
| 中等 | 8 层 | ~2秒 | 中级 |
| 困难 | 10 层 | ~4秒 | 中高级 |

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

然后在浏览器中打开 [http://localhost:5173](http://localhost:5173)

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 📁 项目结构

```
zgxq/
├── src/
│   ├── main.jsx              # 应用入口
│   ├── App.jsx               # 根组件
│   ├── App.css              # 应用样式
│   ├── ChessBoard.jsx       # 棋盘组件
│   ├── gameLogic.js         # 象棋规则逻辑
│   ├── position.js          # 局面表示（AI引擎）
│   ├── search.js            # 搜索算法（AI引擎）
│   ├── aiEngineAdapter.js   # AI引擎适配器
│   └── index.css            # 全局样式
├── public/                   # 静态资源
├── AI_ENGINE_README.md      # AI引擎技术文档
├── package.json
└── vite.config.js
```

## 🎮 游戏说明

### 双人对战
1. 选择"双人对战"模式
2. 红方先手，轮流走棋
3. 点击棋子选中，再点击目标位置完成移动

### 人机对战
1. 选择"人机对战"模式
2. 选择 AI 难度和先后手
3. 点击"人机对战"按钮开始游戏
4. 轮到 AI 时会自动思考并走棋

### 规则
- 符合中国象棋标准规则
- 支持所有棋子的合法走法
- 实现"将帅不照面"规则
- 自动检测将军和将死

## 🛠️ 技术栈

- **前端框架**: React 19
- **构建工具**: Vite 7 + Rolldown
- **样式**: CSS Modules
- **棋盘渲染**: Canvas API
- **AI 引擎**: 改编自 XQlightweight
- **代码规范**: ESLint

## 🧠 AI 引擎技术

本项目的 AI 引擎完全基于 [XQlightweight](https://github.com/xqbase/xqlightweight)（象棋小巫师）实现，包含以下核心算法：

- **Zobrist Hash**: 快速局面识别
- **迭代加深搜索**: 时间控制和深度优化
- **Alpha-Beta 剪枝**: 减少搜索节点
- **PVS 搜索**: 主变优化
- **Null Move 剪枝**: 提前剪枝
- **静态搜索**: 避免视界效应
- **置换表**: 缓存已搜索局面
- **历史启发**: 记录好走法
- **杀手启发**: 优先搜索关键走法

详细技术文档请查看 [AI_ENGINE_README.md](./AI_ENGINE_README.md)

## 📊 性能

- **搜索速度**: 50-100K 节点/秒（取决于硬件）
- **棋力**: 中高级水平（困难难度）
- **响应时间**: 
  - 简单: < 1秒
  - 中等: 1-2秒
  - 困难: 3-4秒

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 开发计划

- [ ] 添加开局库
- [ ] 添加残局库
- [ ] 支持悔棋次数限制
- [ ] 添加棋谱保存和回放
- [ ] 支持在线对战
- [ ] 添加更多难度级别
- [ ] 优化移动端体验

## 📄 许可证

MIT License

## 🙏 致谢

- [XQlightweight](https://github.com/xqbase/xqlightweight) - AI 引擎参考
- [象棋小巫师](https://www.xqbase.com/) - 算法灵感来源

---

**注**: 本项目仅供学习和娱乐使用。
