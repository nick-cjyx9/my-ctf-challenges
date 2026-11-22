package main

import (
	"log"
	"os"
	"strings"
	"time"
)

const (
	flagSKU         = "FLAG-ITEM"
	flagPath        = "/flag"
	initialWallet   = 100_000
	sellReviewDelay = 120 * time.Millisecond
	maxOrderCount   = 1000
)

func loadFlag() string {
	if v := os.Getenv("FLAG"); v != "" {
		return v
	}
	if b, err := os.ReadFile(flagPath); err == nil {
		return strings.TrimSpace(string(b))
	}
	log.Printf("WARNING: 既没有 FLAG 环境变量也没有 %s，会下发占位 flag", flagPath)
	return "flag{fake_flag_for_local_test}"
}

var flagValue = loadFlag()
