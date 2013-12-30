package main

import (
	"encoding/json"
	"github.com/Miniand/weigh/model"
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/codegangsta/martini-contrib/gzip"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/dancannon/gorethink"
	"net/http"
)

func main() {
	m := martini.Classic()
	m.Use(gzip.All())
	m.Use(render.Renderer(render.Options{
		Layout: "layout",
	}))
	// Database related middleware
	conn, err := gorethink.Connect(map[string]interface{}{
		"address":  "localhost:28015",
		"database": "weigh",
	})
	if err != nil {
		panic(err.Error())
	}
	m.Map(conn)
	m.Map(gorethink.Db("weigh"))
	m.Post("/:id", binding.Json(model.Plan{}), Save)
	m.Get("/:id", Plan)
	m.Get("/", Index)
	m.Run()
}

func Index(r render.Render, conn *gorethink.Session, db gorethink.RqlTerm) {
	resp, err := db.Table("plans").Insert(model.Plan{}).RunWrite(conn)
	if err != nil {
		panic(err.Error())
	}
	r.Redirect("/" + resp.GeneratedKeys[0])
}

func Plan(r render.Render, params martini.Params, conn *gorethink.Session,
	db gorethink.RqlTerm) {
	row, err := db.Table("plans").Get(params["id"]).RunRow(conn)
	if err != nil {
		panic(err.Error())
	}
	plan := model.Plan{}
	if err := row.Scan(&plan); err != nil {
		panic(err.Error())
	}
	encoded, err := json.Marshal(plan)
	if err != nil {
		panic(err.Error())
	}
	r.HTML(http.StatusOK, "plan", map[string]string{
		"id":    params["id"],
		"model": string(encoded),
	})
}

func Save(r render.Render, plan model.Plan, params martini.Params,
	conn *gorethink.Session, db gorethink.RqlTerm) {
	wr, err := db.Table("plans").Get(params["id"]).Replace(plan).RunWrite(conn)
	if err != nil {
		panic(err.Error())
	}
	if wr.Errors > 0 {
		panic(wr.FirstError)
	}
	r.JSON(http.StatusCreated, true)
}
