# build environment
FROM node:current-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG SERVERS='[{"name":"Local Server","location":"Local","url":"","image":"synclounge-white.png"}]'
ARG SOURCE_COMMIT
ARG SOURCE_BRANCH
RUN npm run build

# dependency build environment
FROM node:current-alpine as dependency-stage
WORKDIR /app
## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python make g++
RUN NPM_CONFIG_PREFIX=/app/.npm-global npm install -g syncloungesocket@2.0.6 nconf
COPY docker-entrypoint.sh .
COPY config config

# production environment
FROM node:current-alpine as production-stage
WORKDIR /app
COPY --from=build-stage /app/dist dist
COPY --from=dependency-stage /app .
ENTRYPOINT ["./docker-entrypoint.sh"]
