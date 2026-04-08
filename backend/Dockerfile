FROM node:20-alpine

WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm","start"]

