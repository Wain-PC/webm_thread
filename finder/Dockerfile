FROM node:9

COPY config /app/config
COPY ./finder/package.json /app/
COPY ./finder/yarn.lock /app/
WORKDIR /app
RUN yarn
COPY finder /app

CMD ["node", "index.js"]