import dotenv from "dotenv"
import {Pool} from "pg"


dotenv.config()

const conn = new Pool({
    connectionString:process.env.POSTGRES_URI,
    ssl:{
        rejectUnauthorized:false
    },


})
conn.connect()
  .then(() => console.log(" Database connected successfully"))
  .catch((err) => console.error(" Database connection error:", err));


export default conn