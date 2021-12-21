FROM node:slim

ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

RUN mkdir /app/src

COPY . ./src

CMD [ "node", "/app/src/cmd.js" ]


