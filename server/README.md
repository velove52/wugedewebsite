# Server Setup

这个目录是给你的网站准备的 `Node.js + Express + MySQL` 后端。

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

复制一份：

```bash
copy .env.example .env
```

然后填写：

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `CLIENT_ORIGIN`

## 3. 初始化数据库

把 [schema.sql](/j:/Projects/我的网站/server/sql/schema.sql) 里的 SQL 导入 MySQL。

## 4. 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

## 5. 已提供接口

- `GET /api/health`
- `GET /api/songs`
- `GET /api/messages`
- `POST /api/messages`
- `POST /api/messages/:messageId/replies`
- `POST /api/uploads`

## 6. 请求示例

### 新增留言

```json
{
  "authorName": "Velove",
  "content": "今天想循环晴天",
  "imageUrl": "/uploads/xxx.jpg",
  "imageName": "cover.jpg"
}
```

### 新增回复

```json
{
  "authorName": "匿名",
  "content": "我也喜欢这首歌",
  "imageUrl": null,
  "imageName": null
}
```

### 上传图片

使用 `multipart/form-data`，字段名必须是 `image`。
