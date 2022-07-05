package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"log"
	"strings"
	"strconv"
	"settings"
	"models"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
	"github.com/julienschmidt/httprouter"
	"logger"
	"github.com/dgrijalva/jwt-go"
	"context"
)

var env = "development"

type JsonResponse struct {
	Ok			bool	`json:"ok"`
	Status 		int16  	`json:"status"`
	StatusText	string	`json:"statusText"`
	Data 	interface{} `json:"data"`
}

type Home struct {
	Title    string
	SubTitle string
}

type DataBaseServices struct {
	db models.UserRepository
	rdb models.TokenRepository
}

type UserRepository struct {
	db models.UserRepository
}

type TokenRepository struct {
	rdb models.TokenRepository
}

var standardLogger = logger.Init()

var ctx = context.Background()

var jwtSecret = []byte("secret_key")

func main() {
	envData := settings.GetEnvData(env)

	// MySQL Connection
	dns := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?charset=utf8&parseTime=True&loc=Local", envData.Mysql.User, envData.Mysql.Password, envData.Mysql.Host, envData.Mysql.DB)
	db, errorDB := models.InitDB("mysql", dns)
	if errorDB != nil {
        log.Panic(errorDB)
	}

	defer db.Close()

	//rdb, errorRDB := models.InitREDIS(fmt.Sprintf("%s:%s", envData.redis.host, envData.redis.port), envData.redis.password, envData.redis.DB)
	rdb, errorRDB := models.InitREDIS()
	if errorRDB != nil {
        log.Panic(errorRDB)
	}

	defer rdb.Close()

	dbServices:= &DataBaseServices{db, rdb}

	router := httprouter.New()

	router.GET("/", homeHandler)

	// Authentication
	router.POST("/signin", 			dbServices.SignIn)
	router.POST("/login", 			dbServices.Login)
	router.POST("/refresh_token", 	dbServices.RefreshToken)
	router.POST("/logout", 			dbServices.Auth(dbServices.Logout))

	// Users
	router.GET("/users", 			dbServices.Auth(dbServices.GetUsers))
	router.POST("/users", 			dbServices.Auth(dbServices.CreateUser))
	router.GET("/users/:id", 		dbServices.Auth(dbServices.GetUser))
	router.PATCH("/users/:id", 		dbServices.Auth(dbServices.UpdateUser))
	router.DELETE("/users/:id", 	dbServices.Auth(dbServices.DeleteUser))

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowCredentials: true,
		AllowedHeaders: []string{"Content-Type", "Origin", "Accept", "*"},
		AllowedMethods: []string{"GET", "POST", "DELETE", "PUT", "OPTIONS"}})

	// Server
	log.Fatal(http.ListenAndServe(":"+ envData.Server.Port, c.Handler(router)))
}

func ExtractToken(r *http.Request) string {
	bearToken := r.Header.Get("Authorization")

	strArr := strings.Split(bearToken," ")
	if len(strArr) == 2 {
	   return strArr[1]
	}
	return ""
}

func VerifyToken(tokenString string) (*jwt.MapClaims, error) {
    
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("VerifyToken: unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("VerifyToken: %v",  err.Error())
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, fmt.Errorf("VerifyToken: map claims error")
}

// Authentication middleware
func (service *DataBaseServices) Auth(next httprouter.Handle) httprouter.Handle {
    return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if r.Header["Authorization"] == nil {
			standardLogger.ThrowError(http.StatusInternalServerError, "Auth middleware", "unauthorized")
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		tokenString := ExtractToken(r)
		claims, err := VerifyToken(tokenString)
	
		if err != nil {
			standardLogger.ThrowError(http.StatusUnauthorized, "Auth middelware - verify token", err.Error())
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		accessUuid  := (*claims)["access_uuid"].(string)
		_, errorToken := service.rdb.CheckToken(accessUuid)
		if errorToken != nil {
			standardLogger.ThrowError(http.StatusUnauthorized, "Auth middelware - check token error", errorToken.Error())
			http.Error(w, errorToken.Error(), http.StatusUnauthorized)
			return
		}

        next(w, r, ps)
    }
}

/********* ACTIONS *********/

// Home page
func homeHandler(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	home := Home{"This message come from back-end Server", "Just a subtitle from back-end"}

	js, err := json.Marshal(home)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(js)
}

func (service *DataBaseServices) Login(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var credentials models.Credentials

	err := json.NewDecoder(req.Body).Decode(&credentials)
	if err != nil {
		standardLogger.ThrowError(http.StatusUnprocessableEntity, "Login - Decode credentials from body", err.Error())
		http.Error(w, "login.unprocessable", http.StatusUnprocessableEntity)
		return
	}

	user, errUser := service.db.GetUserByEmail(credentials.Email)

	if errUser != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	password := []byte(credentials.Password)

	if errCredentials := bcrypt.CompareHashAndPassword(user.Password, password); errCredentials != nil {
		standardLogger.ThrowError(http.StatusUnauthorized, "Login - Compare password", errCredentials.Error())
		http.Error(w, "login.credentials", http.StatusUnauthorized)
		return
	}

	token, errToken := service.rdb.CreateToken(user)

	if errToken != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Login - Create token", errToken.Error())
		http.Error(w, "login.create-token", http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "Login - Token got it", Data: token}

	if errResponse := json.NewEncoder(w).Encode(response); errResponse != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Login - Encoding response", errResponse.Error())
		http.Error(w, "login.generic", http.StatusInternalServerError)
	}
}

// POST /logout
func (service *DataBaseServices) Logout(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	if req.Header["Authorization"] == nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Logout", "No token")
		http.Error(w, "unauthorized", http.StatusInternalServerError)
		return
	}

	tokenString := ExtractToken(req)
	claims, err := VerifyToken(tokenString)

	if err != nil {
		standardLogger.ThrowError(http.StatusUnauthorized, "Logout - verify token", err.Error())
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	accessUuid  := (*claims)["access_uuid"].(string)

	var refreshTokenString = &models.RefreshToken{}

	errRefreshToken := json.NewDecoder(req.Body).Decode(refreshTokenString)
	if errRefreshToken != nil {
		standardLogger.ThrowError(http.StatusUnprocessableEntity, "Logout -  Decode refresh token from body", errRefreshToken.Error())
		http.Error(w, "signin.unprocessable", http.StatusUnprocessableEntity)
		return
	}

	refreshToken, errRefreshToken := jwt.Parse(refreshTokenString.Data, func(refreshToken *jwt.Token) (interface{}, error) {
		if _, ok := refreshToken.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("VerifyToken: unexpected signing method: %v", refreshToken.Header["alg"])
		}
		return jwtSecret, nil
	})

	if errRefreshToken != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Logout parse refresh token", errRefreshToken.Error())
		http.Error(w, errRefreshToken.Error(), http.StatusInternalServerError)
		return
	}

	refreshClaims := refreshToken.Claims.(jwt.MapClaims)
	refreshUuid := (refreshClaims)["refresh_uuid"].(string)

	
	//refreshUuid  := (*refreshClaims)["refresh_uuid"].(string)


	errLogout := service.rdb.Logout(accessUuid, refreshUuid)
	if errLogout != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Logout", errLogout.Error())
		http.Error(w, errLogout.Error(), http.StatusInternalServerError)
		return
	}

	/*
	accessUuid  := (*claims)["access_uuid"].(string)
	refreshUuid  := (*claims)["refresh_uuid"].(string)

	fmt.Println(accessUuid)
    fmt.Println(refreshUuid)
	errLogout := service.rdb.Logout(accessUuid, refreshUuid)
	
	if errLogout != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Logout", errLogout.Error())
		http.Error(w, errLogout.Error(), http.StatusInternalServerError)
		return
	}
*/
	response := JsonResponse{Ok: true, Status: 200, StatusText: "Logout successfully", Data: ""}
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Logout - Encoding response", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
}

// GET /users
func (service *DataBaseServices) SignIn(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	
	var userData = &models.UserData{}

	errUserData := json.NewDecoder(req.Body).Decode(userData)
	if errUserData != nil {
		standardLogger.ThrowError(http.StatusUnprocessableEntity, "SignIn -  Decode user data from body", errUserData.Error())
		http.Error(w, "signin.unprocessable", http.StatusUnprocessableEntity)
		return
	}

	checkedUser, errQuery := service.db.GetUserByEmail(userData.Email)
	
	if errQuery == nil {
		response := JsonResponse{Ok: true, Status: 204, StatusText: "SignIn - A user with provided email exists", Data: checkedUser.Email}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			standardLogger.ThrowError(http.StatusInternalServerError, "SignIn - Encoding response", err.Error())
			http.Error(w, "signin.generic", http.StatusInternalServerError)
			return
		}
		return
	}

	password := []byte(userData.Password)
	hashedPassword, errPassword := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost) // bcrypt.MinCost

	if errPassword != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "SignIn - Hashing pasword", errPassword.Error())
		http.Error(w, "signin.generic", http.StatusInternalServerError)
		return
    }

	var user = &models.User{ Name: userData.Name, Surname: userData.Surname, Email: userData.Email, Password: hashedPassword, Active: true }

	createdUser, errCreated := service.db.CreateUser(user)
	if errCreated != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "SignIn - Create user", errCreated.Error())
		http.Error(w, "signin.create-user", http.StatusInternalServerError)
		return
	}

	token, errToken := service.rdb.CreateToken(createdUser)

	if errToken != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "SignIn - Create token", errToken.Error())
		http.Error(w, "signin.create-token", http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "SignIn - Token got it", Data: token}

	if errResponse := json.NewEncoder(w).Encode(response); errResponse != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Encoding response", errResponse.Error())
		http.Error(w, "signin.generic", http.StatusInternalServerError)
	}

}

func (service *DataBaseServices) RefreshToken(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	
	refreshToken := &models.RefreshToken{}

	errToken := json.NewDecoder(req.Body).Decode(&refreshToken)
	if errToken != nil {
		standardLogger.ThrowError(http.StatusBadRequest, "RefreshToken - Get from request", errToken.Error())
		http.Error(w, errToken.Error(), http.StatusBadRequest)
		return
	}
	
	token, err := jwt.Parse(refreshToken.Data, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("RefreshToken: unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "RefreshToken - Parsing error", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var refreshUuid string
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		refreshUuid  = claims["refresh_uuid"].(string)
	} else {
		standardLogger.ThrowError(http.StatusInternalServerError, "RefreshToken ", "Claims error")
		http.Error(w, "Something was wrong", http.StatusInternalServerError)
		return
	}

	newToken, errRefresh := service.rdb.RefreshToken(refreshUuid)
	
	if errRefresh != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "RefreshToken - error refreshing", errRefresh.Error())
		http.Error(w, errRefresh.Error(), http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "RefreshToken - Token is valid", Data: newToken}
	fmt.Println(response)

	if errResponse := json.NewEncoder(w).Encode(response); errResponse != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "RefreshToken -  Encoding response", errResponse.Error())
		http.Error(w, errResponse.Error(), http.StatusInternalServerError)
	}
}

// GET /users
func (service *DataBaseServices) GetUsers(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	queryPage := req.URL.Query().Get("page")

	users, errQuery := service.db.GetUsers(queryPage)
	
	if errQuery != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "GetUsers", errQuery.Error())
		http.Error(w, errQuery.Error(), http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "Users collection got it", Data: users}
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Encoding response", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
}

// GET /users/:id
func (service *DataBaseServices) GetUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	id, errConversion := strconv.ParseUint(ps.ByName("id"), 0, 64)
	if errConversion != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "GetUser", errConversion.Error())
		http.Error(w, errConversion.Error(), http.StatusInternalServerError)
		return
	}

	user, errQuery := service.db.GetUser(id)
	if errQuery != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "GetUser", errQuery.Error())
		http.Error(w, errQuery.Error(), http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "User got it", Data: user}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Encoding response", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	/*
	response, err := json.Marshal(user)
	if err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "GetUser", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(response)
	*/
}

// POST /users
func (service *DataBaseServices) CreateUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	var user = &models.User{}
	err := json.NewDecoder(req.Body).Decode(&user)
    if err != nil {
		standardLogger.ThrowError(http.StatusBadRequest, "CreateUser", err.Error())
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

	createdUser, errQuery := service.db.CreateUser(user)
	if errQuery != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "CreateUser", errQuery.Error())
		http.Error(w, errQuery.Error(), http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "User created", Data: createdUser}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Encoding response", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
}
// PATCH /users/:id
func (service *DataBaseServices) UpdateUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	id, errConversion := strconv.ParseUint(ps.ByName("id"), 0, 0)
	if errConversion != nil {
		http.Error(w, errConversion.Error(), http.StatusInternalServerError)
		return
	}

	var user = &models.User{}
	err := json.NewDecoder(req.Body).Decode(&user)
    if err != nil {
		standardLogger.ThrowError(http.StatusBadRequest, "UpdateUser", err.Error())
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }


	storedUser, errQuery := service.db.UpdateUser(user, id) 
	if errQuery != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "UpdateUser", errQuery.Error())
		http.Error(w, errQuery.Error(), http.StatusInternalServerError)
		return
	}
	

	response := JsonResponse{Ok: true, Status: 200, StatusText: "User updated", Data: storedUser}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Encoding response", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
}

// DELETE /users/:id
func (service *DataBaseServices) DeleteUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	id, errConversion := strconv.ParseUint(ps.ByName("id"), 0, 64)
	if errConversion != nil {
		http.Error(w, errConversion.Error(), http.StatusInternalServerError)
		return
	}

	deleted, errQuery := service.db.DeleteUser(id)
	if errQuery != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "DeleteUser", errQuery.Error())
		http.Error(w, errQuery.Error(), http.StatusInternalServerError)
		return
	}

	response := JsonResponse{Ok: true, Status: 200, StatusText: "User deleted", Data: deleted}
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		standardLogger.ThrowError(http.StatusInternalServerError, "Encoding response", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
	
}