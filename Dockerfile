FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /srv

# Không có thư viện ngoài nên không cần npm install
COPY package.json server.js ./
COPY app ./app
COPY app-poodle ./app-poodle
COPY app-noel ./app-noel
COPY design ./design
COPY docs ./docs

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
