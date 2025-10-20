import express from "express"
import { createString } from "../controllers/stringController"


const router = express.Router()

router.route("/").post(createString)
// router.route("/:stringValue").get().delete()


export default router