import express, { Router } from "express"
import { me, signin, signout, signup } from "../controllers/auth.controller.js"
import { middleware } from "../middlewares/authMiddleware.js"
const router:Router = express.Router()

router.post("/signup",signup)
router.post("/signin",signin)
router.post("/signout",signout)
router.get("/me",middleware,me)


export default router