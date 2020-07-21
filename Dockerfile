# build environment
FROM node:latest-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production environment
FROM node:latest-alpine as production-stage
WORKDIR /app
COPY --from=build-stage /app/dist .
RUN npm install -g syncloungesocket@2.0.5
CMD ["syncloungesocket", "--static_path", "."] 