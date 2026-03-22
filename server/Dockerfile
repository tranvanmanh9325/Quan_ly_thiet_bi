# ---- Stage: Production ----
FROM node:20-alpine

WORKDIR /app

# Copy package files trước để tận dụng layer cache
COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
