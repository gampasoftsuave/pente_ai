FROM node:20.9.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
 
FROM node:20.9.0-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Optional: if you use .env
# COPY .env .
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "dist/src/main"]