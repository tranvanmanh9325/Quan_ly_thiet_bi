# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# GEMINI_API_KEY sẽ được truyền vào lúc build qua --build-arg
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình nginx để hỗ trợ React Router (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
