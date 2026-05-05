FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy prisma schema first
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy rest of source code
COPY . .

# Build TypeScript
RUN npm run build || true

EXPOSE 4002

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js || npx ts-node src/main.ts"]
