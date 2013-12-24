package main

import (
	"encoding/base64"
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/gzip"
	"github.com/codegangsta/martini-contrib/render"
	"net/http"
)

func main() {
	m := martini.Classic()
	m.Use(render.Renderer())
	m.Use(gzip.All())
	m.Use(martini.Static("assets"))
	m.Get("/:id", Plan)
	m.Get("/", Index)
	m.Run()
}

func Index(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/"+base64.StdEncoding.EncodeToString([]byte("fart")),
		http.StatusFound)
}

func Plan(params martini.Params) string {
	return params["id"]
}
