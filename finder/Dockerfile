FROM node:9

COPY config /app/config
COPY rabbit /app/rabbit
COPY finder/package.json /app/finder/
COPY finder/yarn.lock /app/finder/
COPY finder/finder.js /app/finder/
WORKDIR /app/finder
RUN yarn
ENV NODE_ENV "finder"
ENV NODE_CONFIG_DIR "/app/config"

CMD ["node", "finder.js"]
