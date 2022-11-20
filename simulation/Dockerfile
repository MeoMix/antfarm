FROM rust:1.65.0-alpine3.16 AS base

# Create a root directory for the application
RUN mkdir -p /usr/app
WORKDIR /usr/app

# Copy source files into Dockerfile
COPY Cargo.lock ./Cargo.lock
COPY Cargo.toml ./Cargo.toml
COPY src ./src

FROM base AS development

RUN cargo build
CMD ["./target/debug/antfarm"]

FROM base AS production

RUN cargo build --release
CMD ["./target/release/antfarm"]
