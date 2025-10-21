import express from "express"
import { createString, getString, getAllStrings, deleteString,filterByNaturalLanguage} from "../controllers/stringController"


const router = express.Router()

router.post("/", createString);
router.get("/filter-by-natural-language", filterByNaturalLanguage);

router.get("/:value", getString);
router.get("/", getAllStrings);
router.delete("/:value", deleteString);




export default router