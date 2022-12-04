FROM node:19.2.0-alpine3.16 AS base

# Install the apt-utils package
RUN apk add --no-cache apt-utils

# Install node and npm
RUN apt-get install -y node npm

# Create a root directory for the application
RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY package-lock.json ./package-lock.json
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY public ./public
COPY src ./src

FROM base AS development

CMD ["npm" "run predeploy"]
