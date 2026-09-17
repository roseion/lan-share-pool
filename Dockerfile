FROM node:22-alpine

WORKDIR /app

# 零 npm 依赖，无需 install，直接复制源码
COPY package.json ./
COPY server ./server
COPY public ./public

ENV PORT=8081
EXPOSE 8081

# 共享目录与数据目录，建议挂载出来
VOLUME ["/app/shared", "/app/data"]

CMD ["node", "server/server.js"]
