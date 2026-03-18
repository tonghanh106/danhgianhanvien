# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN rm -f package-lock.json && npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN rm -f package-lock.json && npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]

