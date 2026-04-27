# syntax=docker/dockerfile:1.7
# Multi-stage build for @autharis/api

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN npm install --omit=dev=false

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npx tsc

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4010
RUN addgroup -S app && adduser -S app -G app
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN npm prune --omit=dev || true
USER app
EXPOSE 4010
CMD ["node", "dist/server.js"]
