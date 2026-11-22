package main

import (
	"encoding/json"
	"io"
	"net/http"
	"time"
)

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

type orderRequest struct {
	Goods  string `json:"goods"`
	Action string `json:"action"` // "buy" | "sell"
	Count  int    `json:"count"`
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func handleCatalog(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "products": catalog})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	token, sess := sessionFor(r)
	setSessionCookie(w, token)

	var wallet int
	var inventory map[string]int
	withLock(func() {
		wallet = sess.Wallet
		inventory = make(map[string]int, len(sess.Inventory))
		for goods, n := range sess.Inventory {
			inventory[goods] = n
		}
	})

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":        true,
		"wallet":    wallet,
		"inventory": inventory,
	})
}

func handleOrder(w http.ResponseWriter, r *http.Request) {
	token, sess := sessionFor(r)
	setSessionCookie(w, token)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "message": "read error"})
		return
	}

	var req orderRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "message": "bad request"})
		return
	}

	product, ok := findProduct(req.Goods)
	if !ok {
		writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "message": "商品不存在"})
		return
	}
	count := req.Count
	if count < 1 {
		count = 1
	}
	if count > maxOrderCount {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"ok": false, "message": "单笔数量超出上限",
		})
		return
	}

	switch req.Action {
	case "buy":
		handleBuy(w, sess, product, count)
	case "sell":
		handleSell(w, sess, product, count)
	default:
		writeJSON(w, http.StatusOK, map[string]any{
			"ok": true, "message": "unknown action", "goods": product.Goods,
		})
	}
}

func handleBuy(w http.ResponseWriter, sess *Session, product Product, count int) {
	cost := product.Price * count

	var bought bool
	var owned int
	withLock(func() {
		if sess.Wallet < cost {
			return
		}
		sess.Wallet -= cost
		sess.Inventory[product.Goods] += count
		bought = true
		owned = sess.Inventory[product.Goods]
	})

	if !bought {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"ok": false, "message": "持有金额不足，无法购买！", "wallet": sess.Wallet,
		})
		return
	}

	resp := map[string]any{
		"ok":      true,
		"message": "购买成功！『" + product.Name + "』",
		"goods":   product.Goods,
		"wallet":  sess.Wallet,
		"owned":   owned,
	}
	if product.Goods == flagSKU {
		resp["message"] = "You have the power to own the flag!"
		resp["serial"] = flagValue
	}
	writeJSON(w, http.StatusOK, resp)
}

func handleSell(w http.ResponseWriter, sess *Session, product Product, count int) {
	if !product.Sellable {
		writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "message": "此商品概不回收！"})
		return
	}

	// 按当前库存受理申请
	var owned int
	withLock(func() {
		owned = sess.Inventory[product.Goods]
	})
	if owned < count {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"ok": false, "message": "持有数量不足，无法出售！", "owned": owned,
		})
		return
	}

	// 等待买家
	time.Sleep(sellReviewDelay)

	var wallet, left int
	withLock(func() {
		sess.Inventory[product.Goods] -= count
		// 防止出现负数库存
		if sess.Inventory[product.Goods] < 0 {
			sess.Inventory[product.Goods] = 0
		}
		sess.Wallet += product.Price * count
		wallet, left = sess.Wallet, sess.Inventory[product.Goods]
	})

	writeJSON(w, http.StatusOK, map[string]any{
		"ok": true, "message": "出售成功！", "goods": product.Goods, "wallet": wallet, "owned": left,
	})
}
