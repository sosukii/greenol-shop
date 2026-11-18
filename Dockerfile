# Бэкенд Greenol (Hono + SQLite). Сборка: docker build -t greenol-api .
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# tsx нужен для запуска TypeScript, поэтому ставим и dev-зависимости (без браузеров Playwright)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
COPY server ./server
EXPOSE 8787
CMD ["npx", "tsx", "server/index.ts"]
