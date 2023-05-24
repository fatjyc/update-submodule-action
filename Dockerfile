FROM alpine/git:latest

RUN apk add curl curl-dev jq

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
