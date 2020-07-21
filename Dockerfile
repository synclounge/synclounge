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
COPY --from=build-stage /app/dist .
RUN npm install -g syncloungesocket@2.0.5
ARG BASE_URL
ENTRYPOINT ["syncloungesocket", "--static_path", "."]
