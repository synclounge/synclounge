# build environment
FROM --platform=$BUILDPLATFORM node:current-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG SERVERS='[{"name":"Local Server","location":"Local","url":"","image":"synclounge-white.png"}]'
ARG SOURCE_BRANCH
ARG REVISION

RUN npm run build

# dependency build environment
FROM node:current-alpine as dependency-stage
WORKDIR /app
## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python make g++
RUN NPM_CONFIG_PREFIX=/app/.npm-global NPM_CONFIG_CACHE=/home/node/.cache npm install --unsafe-perm -g syncloungesocket@4.0.1 nconf
COPY docker-entrypoint.sh .
COPY config config

# production environment
FROM node:current-alpine as production-stage
WORKDIR /app
COPY --from=dependency-stage /app .
COPY --from=build-stage /app/dist dist

ARG VERSION
ARG REVISION
ARG BUILD_DATE

LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.title="SyncLounge"
LABEL org.opencontainers.image.description="Enjoy Plex with your friends. In Sync. Together."
LABEL org.opencontainers.image.url="https://synclounge.tv/"
LABEL org.opencontainers.image.revision=$REVISION
LABEL org.opencontainers.image.source="https://github.com/samcm/synclounge"
LABEL org.opencontainers.image.vendor="SyncLounge"
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.documentation="https://docs.synclounge.tv/"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
