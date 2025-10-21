import express from "express"
import dotenv from "dotenv"
import stringRoute from "./routes/stringRoutes"
import { initializeDatabase } from "./config/initDB"

dotenv.config()


const app = express()

await initializeDatabase()


// Middleware
app.use(express.json())
app.use("/strings",stringRoute)

app.listen(process.env.PORT ||3000,()=>{
    console.log(`Server is running on ${process.env.PORT}`)
})

