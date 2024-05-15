package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type habit struct {
	id        string `json:"id"`
	name      string `json:"name"`
	completed bool   `json:"completed"`
}

var habits = []habit{
	{id: "1", name: "Work Out", completed: false},
	{id: "2", name: "Leet Code", completed: false},
	{id: "3", name: "Work on Project", completed: false},
}

func getHabits(context *gin.Context) {
	return context.IndentedJSON(http.StatusOK, habits)
}

func main() {
	router := gin.Default()
	router.Run("localhost:9090")
	router.GET("/habits", getHabits)
	fmt.Println("This is the start of the backend")
}
