FROM rust:1.65.0-alpine3.16 AS base

RUN apt-get install g++ pkg-config libx11-dev libasound2-dev libudev-dev

# Create a root directory for the application
RUN mkdir -p /usr/app
WORKDIR /usr/app

# Copy source files into Dockerfile
COPY Cargo.lock ./Cargo.lock
COPY Cargo.toml ./Cargo.toml
COPY src ./src

FROM base AS development

CMD ["cargo", "run"]

FROM base AS production

CMD ["cargo", "build --release"]
