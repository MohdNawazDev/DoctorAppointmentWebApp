import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

// const path = require("path");

//app config
const app = express()
connectCloudinary();

const port = process.env.PORT || 4000
connectDB()

//middleware
app.use(express.json())

// it will allow frontend to connect with backend
app.use(cors())

//api end points 
app.use('/api/admin', adminRouter)
//localhost:4000/api/admin

app.use('/api/doctors', doctorRouter)
app.use('/api/user', userRouter)

app.get('/', (req, res) => {
    res.send('API WORKING Great')
})
// console.log("server ---", process.env.JWT_SECRET);
app.listen(port, ()=> console.log("Server started ", port))
