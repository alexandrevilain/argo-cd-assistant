FROM oven/bun:1.3-debian AS builder

WORKDIR /build

COPY package.json bun.lock ./
COPY packages/ ./packages
COPY apps/ ./apps

RUN bun install --frozen-lockfile --production
RUN bun run build:backend

FROM gcr.io/distroless/base-debian12:nonroot AS runner
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /build/dist/server .

EXPOSE 3000
CMD ["./server"]
