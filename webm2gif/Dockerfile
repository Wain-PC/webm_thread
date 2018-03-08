FROM node:9

RUN echo "deb http://ftp.uk.debian.org/debian jessie-backports main" >> /etc/apt/sources.list
RUN apt-get update && apt-get install ffmpeg -y

COPY config /app/config
COPY rabbit /app/rabbit
COPY webm2gif/package.json /app/webm2gif/
COPY webm2gif/yarn.lock /app/webm2gif/
COPY webm2gif/webm2gif.js /app/webm2gif/
COPY webm2gif/gifenc.sh /app/webm2gif/
WORKDIR /app/webm2gif
RUN yarn
ENV NODE_ENV "webm2gif"
ENV NODE_CONFIG_DIR "/app/config"

CMD ["node", "webm2gif.js"]
