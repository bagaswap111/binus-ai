# Stage 1: Install + Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json .
RUN npm install

COPY prisma/ prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json .
RUN npm install --omit=dev

COPY prisma/ prisma/
RUN npx prisma generate

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
