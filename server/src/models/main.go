package models

import (   
    "strconv"
	"time"
	"context"
    "github.com/dgrijalva/jwt-go"
    "github.com/twinj/uuid"
	"github.com/jinzhu/gorm"
    "github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

var ctx = context.Background()
var accessExpSeconds = 60 * 15 * time.Second
var refreshExpSeconds = 60 * 60 * 24 * 7 * time.Second
var jwtSecret = []byte("secret_key")

type User struct {
    MODEL
    Name		    string  `json:"name"`
    Surname 	    string  `json:"surname"`
    Phone           string  `json:"phone"`
    Email 		    string  `json:"email"`
    Password  	    []byte  `json:"-"`
    Active          bool    `json:"active"`
 //   IsSuperAdmin    bool    `json:"is_super_admin"`
}

type UserData struct {
    Name		    string  `json:"name"`
    Surname 	    string  `json:"surname"`
    Phone           string  `json:"phone"`
    Email 		    string  `json:"email"`
    Password  	    string  `json:"password"`
    Active          bool    `json:"active"`
 //   IsSuperAdmin    bool    `json:"is_super_admin"`
}

type Credentials struct {
    Email       string `json:"email"`
	Password    string `json:"password"`
}
  
func (db *DB) GetUsers(page string) (*Paging, error) {
    var users []User
    collection, err := db.paginate(page, &users)

    if err != nil {
        return nil, err
	}

    return collection, nil
}

type AccessToken struct {
    AccessToken		    string  `json:"access_token"`
    AccessExpires       int64   `json:"access_expires"`
}

type Token struct {
    AccessToken		    string  `json:"access_token"`
    AccessExpires       int64   `json:"access_expires"`
    RefreshToken 	    string  `json:"refresh_token"`
    RefreshExpires      int64   `json:"refresh_expires"`
    FullName            string  `json:"full_name"`
    Permissions         []int   `json:"permissions"`
}

type RefreshToken struct {
    Data    string `json:"data"`
}

type DB struct {
    *gorm.DB
}

type RDB struct {
    *redis.Client
}

type MODEL struct {
	*gorm.Model
}

type Paging struct {
    Page       int64 `json:"page"`
    PerPage    int64 `json:"per_page"`
    Total      int64 `json:"total"`
    TotalPages int64 `json:"total_pages"`
    Data       interface{} `json:"data"`
}

type UserRepository interface {
    GetUsers(page string) (*Paging, error)
    CreateUser(*User) (*User, error)
    GetUser(id uint64) (*User, error)
    GetUserByEmail(email string) (*User, error)
    UpdateUser(*User, uint64) (*User, error)
    DeleteUser(id uint64) (uint, error)
    BuildUser(*User) (bool)
}

type TokenRepository interface {
    Logout(accessUuid string, refreshUuid string) (error)
    CheckToken(token string) (string, error)
    RefreshToken(refreshToken string) (*AccessToken, error)
    CreateToken(user *User) (*Token, error)
}

func InitDB(dbName string, dataSourceName string) (*DB, error) {
    var err error
    db, err := gorm.Open(dbName, dataSourceName)
    if err != nil {
        return nil, err
    }
    return &DB{db}, nil
}

func InitREDIS() (*RDB, error) {
    var err error
    rdb := redis.NewClient(&redis.Options{
        Addr:     "redis:6379",
        Password: "", 
        DB:       0, 
    })
  
    if err != nil {
        return nil, err
    }
    return &RDB{rdb}, nil
}

func (db *DB) paginate(queryPage string, value interface{}) (*Paging, error) {
    var total int64

    page, _ := strconv.ParseInt(queryPage, 10, 64)

    if page == 0 {
        page = 1
    }

    perPage := int64(10) 
    offset := int64((page-1) * perPage)
    rows := db.Offset(offset).Limit(perPage).Find(value).Limit(-1).Count(&total)
    totalPages := int64(total / perPage)

    return &Paging{page, perPage, total, totalPages, rows.Value}, nil
}

func (db *DB) GetUserByEmail(email string) (*User, error) {
    user := new(User)
    row := db.Where("email = ?", email).Find(&User{})
    u := row.Scan(&user)
    if u.Error != nil {
        return nil, u.Error
    }
    return user, nil
}

func (db *DB) GetUser(id uint64) (*User, error) {
    user := new(User)
    row := db.Where("id = ?", id).Find(&User{})
    u := row.Scan(&user)
    if u.Error != nil {
        return nil, u.Error
    }
    return user, nil
}

func (db *DB) CreateUser(user *User) (*User, error) {
    created := db.Create(&user)
    if created.Error != nil {
        return nil, created.Error
	}
    return user, nil
}

func (db *DB) UpdateUser(user *User, id uint64) (*User, error) {
    oldUser := db.Where("id = ?", id).Find(&User{})
    updated := oldUser.Updates(&user)
   
    if updated.Error != nil {
        return nil, updated.Error
	}
    return user, nil
}

func (db *DB) DeleteUser(id uint64) (uint, error) {
    deleted := db.Delete(&User{}, id)
    if deleted.Error != nil {
        return 500, deleted.Error
	}
    return 200, nil
}

func (db *DB) BuildUser(user *User) (bool) {
    newUser := db.NewRecord(user)
    return newUser
}

func (rdb *RDB) Logout(accessUuid string, refreshUuid string) (error) {
  
    // Delete Access Token from Redis DB
    errAccess := rdb.Del(ctx, accessUuid).Err()
    if errAccess != nil {
        return errAccess
    }
 
    // Delete Refresh Token from Redis DB
    errRefresh := rdb.Del(ctx, refreshUuid).Err()
    if errRefresh != nil {
        return errRefresh
    }

    return nil
}
   
func (rdb *RDB) CheckToken(uuid string) (string, error) {
    // GET userid from Redis DB
    userid, err := rdb.Get(ctx, uuid).Result()
    if err != nil {
        return "", err
    }

    return userid, nil
}

func CreateAccessToken(accessUuid string) (*AccessToken, error) {
    t := &AccessToken{}
    var err error

    t.AccessExpires = time.Now().UTC().Add(accessExpSeconds).Unix()
    AccessClaims := jwt.MapClaims{}
    AccessClaims["authorized"] = true
    AccessClaims["access_uuid"] = accessUuid 
    AccessClaims["exp"] = t.AccessExpires
    at := jwt.NewWithClaims(jwt.SigningMethodHS256, AccessClaims)
    t.AccessToken, err = at.SignedString(jwtSecret)
    if err != nil {
        return nil, err
    }
    return t, nil
}

func (rdb *RDB) RefreshToken(refreshUuid string) (*AccessToken, error) {
    // GET userid from Redis DB
    userid, errGetUserid := rdb.Get(ctx, refreshUuid).Result()
    if errGetUserid != nil {
        return nil, errGetUserid
    }

    // Create new Access Token
    accessUuid := uuid.NewV4().String()
    t, err := CreateAccessToken(accessUuid)
    if err != nil {
        return nil, err
    }

    // Set Access Token on Redis DB
    errSetAccess := rdb.Set(ctx, accessUuid, userid, accessExpSeconds).Err()
    if errSetAccess != nil {
        return nil, errSetAccess
    }

    return t, nil
}


func (rdb *RDB) CreateToken(user *User) (*Token, error) {
    t := &Token{}
    var err error

    t.FullName = user.Name + " " + user.Surname

    // Create Access token
    accessUuid := uuid.NewV4().String()
    accessToken, errAT := CreateAccessToken(accessUuid)
    if errAT != nil {
        return nil, errAT
    }
    t.AccessExpires = accessToken.AccessExpires
    t.AccessToken = accessToken.AccessToken

    // Create Refresh Token
    refreshUuid := uuid.NewV4().String()
    t.RefreshExpires = time.Now().UTC().Add(refreshExpSeconds).Unix() // int64(refreshExpSeconds/time.Second)
    RefreshClaims := jwt.MapClaims{}
    RefreshClaims["authorized"] = true
    RefreshClaims["refresh_uuid"] = refreshUuid
    RefreshClaims["exp"] = t.RefreshExpires
    rt := jwt.NewWithClaims(jwt.SigningMethodHS256, RefreshClaims)
    t.RefreshToken, err = rt.SignedString(jwtSecret)
    if err != nil {
       return nil, err
    }
    
    // Set Access Token on Redis DB
    errSetAccess := rdb.Set(ctx, accessUuid, user.ID, accessExpSeconds).Err()
    if errSetAccess != nil {
        return nil, errSetAccess
    }

    // Set Refresh Token on Redis DB
    errSetRefresh := rdb.Set(ctx, refreshUuid, user.ID, refreshExpSeconds).Err()
    if errSetRefresh != nil {
        return nil, errSetRefresh
    }

    return t, nil
}