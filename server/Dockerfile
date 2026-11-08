# ---------- Stage 1: install production packages ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only the package files first. Docker caches each step, so if
# package.json hasn't changed, the slow "npm ci" step is skipped on rebuilds.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: the image that actually runs ----------
FROM node:20-alpine
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY db ./db

# Don't run as root inside the container. The node image includes a "node" user.
USER node

EXPOSE 8080
CMD ["node", "src/index.js"]