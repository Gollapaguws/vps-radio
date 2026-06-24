# api/Dockerfile — development (hot reload via tsx watch)
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Source code is volume-mounted in docker-compose.yml
EXPOSE 4000

CMD ["npm", "run", "dev"]
