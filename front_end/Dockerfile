# Build stage
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
# Dùng npm install vì file package-lock.json đôi lúc bị xung đột nếu không chuẩn (hoặc vite template chưa có)
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Sao chép config Nginx tùy chỉnh (nếu có để fix lỗi React Router 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
