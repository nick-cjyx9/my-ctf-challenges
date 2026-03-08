FROM oven/bun:1 AS base

COPY public/ /usr/src/app/public/
COPY package.json bun.lock index.ts tsconfig.json /usr/src/app/

WORKDIR /usr/src/app

FROM base AS install
RUN bun install --frozen-lockfile

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]
