FROM golang:1.13

ENV GO111MODULE=on
ENV PORT=4201
WORKDIR /server

COPY ./* .
RUN GOPATH=$GOPATH:/tmp
RUN go clean -modcache
RUN go mod download

COPY . .
RUN ["chmod", "+x", "./entrypoint.sh"]

RUN apt update && apt install ca-certificates libgnutls30 -y
RUN go build -a -o out .
RUN  cp out /tmp

EXPOSE 4201

ENTRYPOINT ["./entrypoint.sh"]

CMD [ "/tmp/out" ]
