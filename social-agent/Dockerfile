# VIXCELL Social Agent — Docker image with Playwright + Chromium baked in.
# Use this for hosting on a VPS (Hostinger, Fly.io, Railway, etc.)

FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Persistent browser profile lives in /data so it survives container restarts
ENV BROWSER_PROFILE_DIR=/data/browser-profile
RUN mkdir -p /data/browser-profile

# Default to headless on a server (no display). Override to "true" only when
# debugging via xvfb-run / VNC.
ENV HEADED=false
ENV PORT=3001

EXPOSE 3001

# Drop privileges to the pre-existing pwuser that comes with the Playwright image
USER pwuser

CMD ["node", "server.js"]
