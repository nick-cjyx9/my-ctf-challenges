package main

type ExtraSkill struct {
	Name string `json:"name"`
}

type Product struct {
	Goods       string      `json:"goods"`
	Name        string      `json:"name"`
	Price       int         `json:"price"`
	IconType    string      `json:"iconType"`
	Description string      `json:"description"`
	ExtraSkill  *ExtraSkill `json:"extraSkill,omitempty"`
	Sellable    bool        `json:"sellable"`
}

var catalog = []Product{
	{
		Goods: "p1", Name: "灵异手镜", Price: 5000, IconType: "mirror", Sellable: true,
		ExtraSkill:  &ExtraSkill{Name: "污秽吐息"},
		Description: "会使看的人感到不安的\n深色手镜",
	},
	{
		Goods: "p2", Name: "五寸钉", Price: 5000, IconType: "nail", Sellable: true,
		Description: "打造用于丑时参拜的\n特制长铁钉",
	},
	{
		Goods: "p3", Name: "业火勾玉", Price: 6000, IconType: "magatama", Sellable: true,
		Description: "寄宿着红莲劫火的\n赤色古代勾玉",
	},
	{
		Goods: "p4", Name: "伊邪那岐大神", Price: 99_999_999, IconType: "magatama", Sellable: true,
		Description: "🐱:萨斯噶周可儿！",
	},
	{
		Goods: flagSKU, Name: "秘宝·弗拉格尔", Price: 99_999_999, IconType: "magatama", Sellable: false,
		ExtraSkill:  &ExtraSkill{Name: "非卖品"},
		Description: "If you want it, then you'll have to take it. But you already knew that...",
	},
}

func findProduct(goods string) (Product, bool) {
	for _, p := range catalog {
		if p.Goods == goods {
			return p, true
		}
	}
	return Product{}, false
}
