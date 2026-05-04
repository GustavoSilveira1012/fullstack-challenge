FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code and prisma schema
COPY . .

# Generate Prisma client
RUN bun run build

EXPOSE 4001

CMD ["bun", "run", "src/main.ts"]
