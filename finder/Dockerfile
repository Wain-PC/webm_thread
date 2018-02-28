FROM node:9

COPY ./package.json /app/
COPY ./yarn.lock /app/
WORKDIR /app
RUN yarn
COPY . /app

CMD ["node", "index.js"]