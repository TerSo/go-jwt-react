package main

import (
	"settings"
	"models"
	"fmt"
	"log"
)
var env = "development"

type Env struct {
	db models.UserRepository
}

func main() {

	envData := settings.GetEnvData(env)
	
	dns := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?charset=utf8&parseTime=True&loc=Local", envData.Mysql.User, envData.Mysql.Password, envData.Mysql.Host, envData.Mysql.DB)
	fmt.Println(dns)
	db, errorDB := models.InitDB("mysql", dns)
	
	if errorDB != nil {
        log.Panic(errorDB)
	}
	defer db.Close()

	db.AutoMigrate(&models.User{})
	
	fmt.Println("migrated!")

	/*
	env := &Env{db}
	user := &models.User{ Name: "Salvatore", Surname:"Terranova",  Phone: "3333", Email: "mail@example.com", Password: "admin", Active: true}
	created, errCreated := env.db.CreateUser(user)
	
	fmt.Println(created)
	fmt.Println(errCreated)
	*/
}