package model

type Plan struct {
	Height   int
	Goals    []Goal
	WeighIns []WeighIn
}

func NewPlan() Plan {
	return Plan{
		Goals:    []Goal{},
		WeighIns: []WeighIn{},
	}
}
