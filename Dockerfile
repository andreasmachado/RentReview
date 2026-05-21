FROM node:20-alpine

# Required for building native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Vite frontend
RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production
ENV DATABASE_URL=/data/rentreview.db

CMD ["./node_modules/.bin/tsx", "src/server/index.ts"]
