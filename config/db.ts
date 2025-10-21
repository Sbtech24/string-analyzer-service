import dotenv from "dotenv"
import {Pool} from "pg"


dotenv.config()

const conn = new Pool({
    connectionString:process.env.POSTGRES_URI,
    ssl:{
        rejectUnauthorized:false
    },


})

export default conn