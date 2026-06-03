FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:18-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "./bin/www"]