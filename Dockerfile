# build environment
FROM --platform=$BUILDPLATFORM node:22.2.0-alpine3.18 as build-stage
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
RUN apk add --no-cache python3 make g++
USER node
COPY --link --chown=1000:1000 package*.json ./
RUN SKIP_BUILD=true npm ci
COPY --link --chown=1000:1000 . .

ARG VERSION

RUN npm run build

# dependency environment
FROM node:22.2.0-alpine3.18 as dependency-stage
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
RUN apk add --no-cache python3 make g++
USER node
COPY --link --chown=1000:1000 package*.json ./
RUN SKIP_BUILD=true npm ci
RUN npm prune --production

# production environment
FROM node:22.2.0-alpine3.18 as production-stage
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
RUN apk add --no-cache tini

USER node
COPY --link --chown=1000:1000 server.js .
COPY --link --chown=1000:1000 config config
COPY --link --chown=1000:1000 --from=dependency-stage /app/node_modules node_modules
COPY --link --chown=1000:1000 --from=build-stage /app/dist dist

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/server.js"]
