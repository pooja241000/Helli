FROM node:22-alpine

WORKDIR /app

# Install native build dependencies for SQLite C++ bindings
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/acci-alert.db

VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "--loader", "tsx", "server.ts"]
