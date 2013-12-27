package main

import (
	"encoding/base64"
	"encoding/json"
	"github.com/Miniand/weigh/model"
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/gzip"
	"github.com/codegangsta/martini-contrib/render"
	"net/http"
)

func main() {
	m := martini.Classic()
	m.Use(gzip.All())
	m.Use(render.Renderer(render.Options{
		Layout: "layout",
	}))
	m.Get("/:id", Plan)
	m.Get("/", Index)
	m.Run()
}

func Index(r render.Render) {
	r.Redirect("/" + base64.StdEncoding.EncodeToString([]byte("fart")))
}

func Plan(r render.Render) {
	encoded, err := json.Marshal(model.NewPlan())
	if err != nil {
		panic(err.Error())
	}
	r.HTML(http.StatusOK, "plan", string(encoded))
}
