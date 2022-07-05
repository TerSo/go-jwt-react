module github.com/TerSo/go-jwt-react

go 1.13

require (
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/go-redis/redis/v8 v8.11.4 // indirect
	github.com/go-sql-driver/mysql v1.6.0 // indirect
	github.com/jinzhu/gorm v1.9.16 // indirect
	github.com/julienschmidt/httprouter v1.3.0
	github.com/rs/cors v1.8.2
	github.com/sirupsen/logrus v1.8.1 // indirect
	github.com/twinj/uuid v1.0.0 // indirect
	golang.org/x/crypto v0.0.0-20220214200702-86341886e292
	logger v0.0.0-00010101000000-000000000000
	models v0.0.0-00010101000000-000000000000
	settings v0.0.0-00010101000000-000000000000
)

replace logger => ./logger

replace settings => ./settings

replace models => ./models
