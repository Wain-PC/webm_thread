FROM node:9

COPY config /app/config
COPY ./parser/package.json /app/
COPY ./parser/yarn.lock /app/
WORKDIR /app
RUN yarn
COPY parser /app
ENV NODE_ENV=parser

CMD ["node", "index.js"]