FROM golang:1.24-alpine As builder

WORKDIR /app

RUN apk add --no-cache git

# copy dependencies
COPY go.mod go.sum ./
RUN go mod download

# copy source code
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app ./Delivery

# ------ Final Stage ------
FROM alpine:3.19

WORKDIR /app

# Add CA certificates (for HTTPS Calls)
RUN apk add --no-cache ca-certificates

# Copy binary and config from builder
COPY --from=builder /app/app .
COPY --from=builder /app/config.yaml .
EXPOSE 8080

CMD ["./app"]