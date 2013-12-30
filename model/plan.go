package model

type Plan struct {
	Id       string `gorethink:"id,omitempty"`
	Height   float64
	Goals    []Goal
	WeighIns []WeighIn
}

func NewPlan() Plan {
	return Plan{
		Goals:    []Goal{},
		WeighIns: []WeighIn{},
	}
}
