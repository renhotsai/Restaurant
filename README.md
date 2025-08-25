# JCA Pizza - Restaurant Delivery System

一個基於 Node.js 和 MongoDB 的餐廳訂餐與配送管理系統，提供完整的線上點餐、訂單管理和配送追蹤功能。

## 專案概述

JCA Pizza 是一個全功能的餐廳管理系統，支援三種不同角色：
- **顧客** - 瀏覽菜單、下單、追蹤訂單
- **餐廳** - 管理訂單、更新訂單狀態
- **外送員** - 接單配送、上傳配送照片

## 技術架構

### 後端技術
- **Node.js** - 伺服器運行環境
- **Express.js** - Web 框架
- **MongoDB** - 資料庫
- **Mongoose** - ODM 資料庫操作
- **Express-Handlebars** - 模板引擎
- **Express-Session** - 會話管理
- **Multer** - 檔案上傳處理

### 前端技術
- **Handlebars** - 動態頁面模板
- **CSS3** - 響應式樣式設計
- **JavaScript** - 前端互動功能

## 系統功能

### 顧客功能
- 瀏覽餐廳資訊和營業時間
- 查看完整菜單和商品詳情
- 自訂披薩尺寸和配料
- 線上下單和結帳
- 訂單狀態即時追蹤
- 查看歷史訂單

### 餐廳管理功能
- 訂單管理和狀態更新
- 依顧客姓名搜尋訂單
- 標記訂單為「準備配送」
- 取消未配送訂單
- 查看所有訂單歷史

### 外送員功能
- 查看可接單列表
- 接受配送任務
- 更新配送狀態
- 上傳配送完成照片
- 查看個人配送歷史

## 訂單狀態流程

```
RECEIVED → READY FOR DELIVERY → IN TRANSIT → DELIVERED
   ↓                                           
CANCELED                                       
```

1. **RECEIVED** - 餐廳已收到訂單，準備中
2. **READY FOR DELIVERY** - 餐點準備完成，等待外送員取餐
3. **IN TRANSIT** - 外送員已取餐，配送中
4. **DELIVERED** - 訂單已送達
5. **CANCELED** - 訂單已取消（僅限 RECEIVED 和 READY FOR DELIVERY 狀態）

## 安裝與設置

### 環境需求
- Node.js (v14+)
- MongoDB 資料庫
- npm 套件管理器

### 安裝步驟

1. **複製專案**
```bash
git clone <repository-url>
cd Restaurant
```

2. **安裝相依套件**
```bash
npm install
```

3. **資料庫設置**
   - 確保 MongoDB 服務運行
   - 更新 `server.js` 中的資料庫連接字串

4. **啟動應用程式**
```bash
npm start
```

5. **開啟瀏覽器**
   - 訪問 `http://localhost:8080`

## 資料庫結構

### 主要數據模型

#### User Model
- 使用者資訊（顧客、餐廳、外送員）
- 包含角色權限管理

#### Product Model  
- 商品資訊和價格
- 支援多種尺寸定價
- 配料和素食標記

#### Order Model
- 訂單主要資訊
- 訂單狀態追蹤
- 顧客和外送員資訊

#### Toppings Model
- 可選配料清單
- 配料價格管理

## 檔案結構

```
Restaurant/
├── server.js              # 主要伺服器檔案
├── package.json           # 專案依賴管理
├── assets/                # 靜態資源
│   ├── css/              # 樣式檔案
│   ├── js/               # 前端 JavaScript
│   └── image/            # 圖片資源
├── views/                # Handlebars 模板
│   ├── layouts/          # 佈局模板
│   └── *.hbs            # 頁面模板
└── node_modules/         # 依賴套件
```

## API 端點

### 公開路由
- `GET /` - 首頁
- `GET /Menu` - 菜單頁面
- `GET /Login` - 登入頁面
- `GET /SignUp` - 註冊頁面

### 認證路由
- `GET /Order` - 訂單管理
- `GET /Driver` - 外送員介面
- `POST /confirm-order` - 確認訂單
- `POST /cancelOrder/:orderId` - 取消訂單

## 部署說明

### 環境變數設置
```bash
PORT=8080
MONGODB_URI=your-mongodb-connection-string
SESSION_SECRET=your-session-secret
```

### 生產環境部署
1. 設置環境變數
2. 確保 MongoDB 資料庫可訪問
3. 使用 PM2 或類似工具管理程序
4. 配置反向代理（Nginx）

## 餐廳資訊

**JCA Pizza**
- 地址：603 Davenport Rd, Toronto, ON M5R 1L1
- 營業時間：上午 11:00 - 凌晨 2:00
- 電話：437-477-6201

## 授權條款

ISC License

## 聯絡資訊

如有技術問題或建議，請透過專案 Issues 頁面聯繫開發團隊。