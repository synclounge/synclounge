# build environment
FROM node:current-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG SERVERS='{"name":"Local Server","location":"Local","url":"/","image":"synclounge-white.png"}'
RUN npm run build

# production environment
FROM node:current-alpine as production-stage
WORKDIR /app
COPY config config
COPY --from=build-stage /app/dist dist
RUN npm install -g syncloungesocket@2.0.5 nconf fs
ENTRYPOINT ["./docker-entrypoint.sh"]
