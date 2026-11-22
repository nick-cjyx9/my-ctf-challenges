FROM golang:1.24-alpine AS build

WORKDIR /src
COPY order-api/go.mod ./
COPY order-api/*.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /order-api .


FROM alpine:3.20

COPY --from=build /order-api /order-api

COPY flag /flag

EXPOSE 8080

USER nobody

CMD ["/order-api"]
