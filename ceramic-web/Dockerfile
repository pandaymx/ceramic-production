# 构建阶段
FROM node:20-alpine as builder

WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --registry=https://registry.npmmirror.com

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 运行阶段
FROM node:20-alpine

WORKDIR /app

# 安装 serve 用于静态服务
RUN npm install -g serve --registry=https://registry.npmmirror.com

# 从构建阶段复制构建输出
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 5173

# 启动应用（serve 必须监听 0.0.0.0）
CMD ["serve", "-s", "dist", "-l", "5173", "--host", "0.0.0.0"]

# 启动应用
CMD ["serve", "-s", "dist", "-l", "5173"]
