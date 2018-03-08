FROM node:9
COPY config /app/config
COPY gifserve/package.json /app/gifserve/
COPY gifserve/yarn.lock /app/gifserve/
COPY gifserve/gifserve.js /app/gifserve/
WORKDIR /app/gifserve
RUN yarn
ENV NODE_ENV "gifserve"
ENV NODE_CONFIG_DIR "/app/config"
EXPOSE 8080

CMD ["node", "gifserve.js"]
