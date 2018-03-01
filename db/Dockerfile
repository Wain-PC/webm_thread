FROM node:9

COPY config /app/config
COPY ./db/package.json /app/
COPY ./db/yarn.lock /app/
WORKDIR /app
RUN yarn
COPY db /app
ENV NODE_ENV=db

CMD ["node", "index.js"]