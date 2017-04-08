FROM mhart/alpine-node:6

WORKDIR /src

COPY . /src

RUN npm install

EXPOSE 8089

CMD [ "node", "/src/server.js" ]
