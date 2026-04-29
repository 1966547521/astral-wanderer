[![Play Now](https://img.shields.io/badge/🎮-Live_Demo-44cc66?style=for-the-badge)](https://你的用户名.github.io/astral-wanderer/)
# 星界旅者 · Astral Wanderer

> 类 Rogue 地牢探险游戏 · 回合制战斗 · Canvas 2D 渲染

基于 **TypeScript + Vite** 构建的纯前端地牢探险游戏，采用自研 **ECS 架构**，实现程序化地牢生成、AP 回合制战斗与碎片 Build 成长系统。

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:3000/
```

**构建生产版本：**

```bash
npm run build
```

---

## 特色

- **ECS 架构** — 自研 Entity-Component-System 框架，组件化驱动战斗/状态/渲染逻辑
- **纯 Canvas 渲染** — 零 HTML/CSS 依赖，全界面自绘，60fps 稳定帧率
- **程序化地牢** — 网格算法随机地图，三层主题各异，每局布局不同
- **AP 回合制战斗** — 行动点驱动，支持攻击/技能/防御/闪避，敌人意图可预判
- **碎片 Build 系统** — 6 槽位 × 4 稀有度，组合技能与被动增益，构建差异化 Build
- **面向接口解耦** — IDungeonManager 接口解耦地图模块，支持灵活替换底层实现
- **LocalStorage 跨局存档** — 时空结晶与旅程次数跨局累计

---

## 操作说明

| 操作 | 方式 |
|------|------|
| 移动 | WASD / 方向键 |
| 交互 | 鼠标点击按钮、格子 |
| 背包 | I |
| 结束回合 | E |
| 切换目标 | 点击敌人 |
| 返回菜单 | ESC |

详细操作指南见 [操作指南.md](操作指南.md)

---

## 项目结构

```
src/
├── core/       游戏核心（Game、EventBus、StateMachine）
├── ecs/        ECS 框架（World、Entity、Component、System）
├── systems/    游戏系统（DungeonSystem、CombatSystem）
├── dungeon/    地图生成（FloorGenerator、IDungeonManager）
├── ui/         UI 渲染（UIManager）
├── render/     Canvas 渲染器
├── data/       数据定义（角色、敌人、碎片、事件）
├── types/      TypeScript 类型定义
├── utils/      工具类（SaveManager、Random）
└── components/ ECS 组件
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 语言 | TypeScript |
| 构建 | Vite |
| 渲染 | Canvas 2D |
| 架构 | ECS（自研）|
| 存档 | LocalStorage |

---

## License

MIT
