# 🤖 AI 图片识别管理平台

集成**百度AI开放平台**的智能图片识别后台管理系统。

## ✨ 功能特性

| 模块 | 功能 |
|------|------|
| 📊 数据概览 | 总识别次数、成功率、类型统计 |
| 🤖 AI图片识别 | 5种类型：通用识别、主体检测、OCR文字识别、内容审核、车牌识别 |
| 📋 识别记录 | 完整历史记录，搜索/筛选/分页 |
| 📦 批量处理 | 批量上传+自动识别+进度条 |

## 🔌 AI识别能力

- **通用识别**：动物+植物+菜品+车辆+地标+Logo 六合一组合识别
- **OCR文字识别**：通用文字提取，支持中英文
- **车牌识别**：多车牌同时检测
- **主体检测**：图像主体位置框选
- **内容审核**：违规内容自动检测

## 🚀 快速开始

### 1. 配置百度AI凭证

编辑 `server.js`，替换 API Key 和 Secret Key：

```javascript
const BAIDU_API_KEY = 'your_api_key';
const BAIDU_SECRET_KEY = 'your_secret_key';
```

### 2. 启动服务器

```bash
# Windows 双击 start.bat
# 或手动启动
node server.js
```

### 3. 使用平台

浏览器打开 `http://localhost:3000`，上传图片即可自动识别。

## 📦 技术栈

- **前端**：HTML5 + CSS3 + JavaScript（纯原生）
- **后端**：Node.js HTTP Server
- **AI**：百度AI开放平台（图像识别 + OCR）
- **存储**：LocalStorage + JSON 文件

## 📁 项目结构

```
├── index.html    # 前端界面（46KB）
├── server.js     # 后端代理服务器
├── start.bat     # Windows一键启动
└── data/         # 识别记录存储（自动创建）
```

## 📄 License

MIT