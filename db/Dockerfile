FROM node:9

COPY config /app/config
COPY rabbit /app/rabbit
COPY db/package.json /app/db/
COPY db/yarn.lock /app/db/
COPY db/db.js /app/db/
WORKDIR /app/db
RUN yarn
ENV NODE_ENV "db"
ENV NODE_CONFIG_DIR "/app/config"

CMD ["node", "db.js"]
