package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	// GET  /api/catalog -> {products:[{goods,name,price,iconType,description,extraSkill,sellable}]}
	// GET  /api/status  -> {wallet, inventory}
	// POST /api/order   -> {"action":"buy"|"sell", "goods":<goods>, "count":<n>}
	// GET  /api/health

	mux := http.NewServeMux()
	mux.HandleFunc("/api/catalog", handleCatalog)
	mux.HandleFunc("/api/status", handleStatus)
	mux.HandleFunc("/api/order", handleOrder)
	mux.HandleFunc("/api/health", handleHealth)

	addr := ":8080"
	if v := os.Getenv("LISTEN"); v != "" {
		addr = v
	}
	log.Printf("order-api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
