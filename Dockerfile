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

# production environment
FROM ttshivers/syncloungesocket:4.0.3 as production-stage
LABEL org.opencontainers.image.title="SyncLounge"
LABEL org.opencontainers.image.description="Enjoy Plex with your friends. In Sync. Together."
LABEL org.opencontainers.image.url="https://synclounge.tv/"
LABEL org.opencontainers.image.source="https://github.com/samcm/synclounge"
LABEL org.opencontainers.image.vendor="SyncLounge"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.documentation="https://docs.synclounge.tv/"

WORKDIR /app
COPY docker-entrypoint.sh .
COPY config config
COPY --from=build-stage /app/dist dist

ARG VERSION
LABEL org.opencontainers.image.version=$VERSION

ARG REVISION
LABEL org.opencontainers.image.revision=$REVISION

ARG BUILD_DATE
LABEL org.opencontainers.image.created=$BUILD_DATE

ENTRYPOINT ["/app/docker-entrypoint.sh"]
