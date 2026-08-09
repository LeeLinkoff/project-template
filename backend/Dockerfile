# Image/container name: <app-name>-backend
# (this is the name passed to `docker build -t` and `docker run --name`
# below in ARCHITECTURE_AND_DEPLOYMENT.md 2.3, not this file's name)
#
# Builds and runs the application's API backend. This runs inside
# Docker so the backend has a known, repeatable Node environment
# independent of the host's installed Node version and libraries
# (see ARCHITECTURE_AND_DEPLOYMENT.md 1.2).
#
# What happens at build time (`docker build`):
#   1. npm install (full install, including devDependencies, since
#      TypeScript and ts-json-schema-generator need to be present at
#      build time to compile and generate schemas, even though they
#      do not run at container start)
#   2. npm run generate:schemas — regenerates schemas.generated.ts
#      from the actual exported service interfaces, so the OpenAPI
#      spec served at /api/docs can't drift out of sync with the code
#   3. npx tsc — compiles server.ts, swagger-spec.ts, and
#      services/**/*.ts to dist/
#
# What happens at container start:
#   node dist/server.js listens on port 3002 inside the container.
#   Only the compiled output runs, not the .ts source. Node does not
#   execute TypeScript directly without a transpiler at runtime.
#
# How this reaches production:
#   deploy-to-vps.yml rsyncs source to /opt/<app-name> on the VPS,
#   runs `docker build` here to produce the <app-name>-backend image,
#   then runs approximately:
#
#   docker run -d \
#     --name <app-name>-backend \
#     --restart unless-stopped \
#     -p 127.0.0.1:3002:3002 \
#     --env-file .env \
#     <app-name>-backend
#
#   Port 3002 is therefore bound to 127.0.0.1 only and is not exposed
#   publicly. Apache's reverse proxy (configured separately, one-time,
#   not by this pipeline; see ARCHITECTURE_AND_DEPLOYMENT.md 2.4)
#   forwards:
#
#     /apps/<app-name>/api/*  ->  127.0.0.1:3002/api/*
#
#   That reverse-proxy rule is the application's public path to the
#   backend.
#
# Rebuilding replaces the image; the old container is removed and a
# new one is created from the new image. The container itself is never
# updated in place.

FROM node:20-alpine

WORKDIR /app

# Full install (not --omit=dev): TypeScript, @types/* packages, and
# schema-generation tooling are devDependencies needed at build time,
# even though they are not needed when the compiled application runs.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Generates schemas.generated.ts from the actual exported service
# interfaces, then compiles server.ts, swagger-spec.ts, and
# services/**/*.ts to dist/.
#
# Order matters: swagger-spec.ts imports schemas.generated.ts, so the
# generated file must exist before tsc runs, not after.
RUN npm run generate:schemas && npx tsc

EXPOSE 3002

# Runs the compiled output, not the TypeScript source directly, since
# Node cannot execute .ts files without a transpiler at runtime.
CMD ["node", "dist/server.js"]