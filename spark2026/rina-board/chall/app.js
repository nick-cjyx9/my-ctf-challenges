import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import { authRouter } from "./src/auth.js";
import { siteRouter } from "./src/routes.js";

const app = express();
app.set("view engine", "ejs");
app.set("views", fileURLToPath(new URL("./views", import.meta.url)));
app.use(express.urlencoded({ extended: false, limit: "128kb" }));
app.use(cookieParser());
app.use(express.static(fileURLToPath(new URL("./public", import.meta.url))));
app.use(authRouter);
app.use(siteRouter);
app.use((req, res) => res.status(404).send("Not found"));
app.listen(3000, "0.0.0.0", () => console.log(`Rina Board listening on 3000`));
