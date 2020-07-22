# build environment
FROM node:current-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG SERVERS='[{"name":"Local Server","location":"Local","url":"","image":"synclounge-white.png"}]'
RUN npm run build

# production environment
FROM node:current-alpine as production-stage
WORKDIR /app
RUN npm install -g syncloungesocket@2.0.6 nconf fs
COPY docker-entrypoint.sh .
COPY config config
COPY --from=build-stage /app/dist dist
ENTRYPOINT ["./docker-entrypoint.sh"]
