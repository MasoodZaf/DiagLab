# AURA LIMS — production container for the web app (@lab/web) in this npm-workspaces monorepo.
# Multi-stage: install + build with full workspace deps, then run `next start` on port 3200.

FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_DIST_DIR=.next-build
# Copy the whole monorepo (see .dockerignore) so npm workspaces resolve, then build the web app.
COPY . .
RUN npm ci
RUN npm run build --workspace @lab/web

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_DIST_DIR=.next-build
ENV PORT=3200
# Bring over the built app + node_modules from the build stage.
COPY --from=build /app ./
EXPOSE 3200
# Uses apps/web "start" script (NEXT_DIST_DIR=.next-build next start); PORT env selects 3200.
CMD ["npm", "run", "start", "--workspace", "@lab/web"]
