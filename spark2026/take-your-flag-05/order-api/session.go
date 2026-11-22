package main

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
)

type Session struct {
	Wallet    int
	Inventory map[string]int
}

var (
	sessionsMu sync.Mutex
	sessions   = make(map[string]*Session)
)

// 不加锁进程要被打烂
func withLock(fn func()) {
	sessionsMu.Lock()
	defer sessionsMu.Unlock()
	fn()
}

func newToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func newInventory() map[string]int {
	inv := make(map[string]int, len(catalog))
	for _, p := range catalog {
		inv[p.Goods] = 0
	}
	return inv
}

func sessionFor(r *http.Request) (string, *Session) {
	token := ""
	if c, err := r.Cookie("session_id"); err == nil {
		token = c.Value
	}

	var sess *Session
	withLock(func() {
		if token != "" {
			if s, ok := sessions[token]; ok {
				sess = s
				return
			}
		}
		token = newToken()
		sess = &Session{Wallet: initialWallet, Inventory: newInventory()}
		sessions[token] = sess
	})

	return token, sess
}

func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
	})
}
