FROM oven/bun:1.1

WORKDIR /app

# No npm deps — only bun-types (dev) so tsconfig resolves in local dev. We
# copy the source tree as-is; Bun executes TypeScript natively.
COPY package.json tsconfig.json ./
COPY src ./src

ENV PORT=4020
EXPOSE 4020

CMD ["bun", "run", "src/server.ts"]
