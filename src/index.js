// require('dotenv').config({path: './env'}) not stable

import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'./.env'
} )

connectDB()
.then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log("⚙️  listening at", process.env.PORT)
    })
})
.catch(error=>{
    console.log("DB conn failed !!! due to ", error)
})



























// import mongoose from "mongoose";
// import { DB_NAME } from './constants';
// import express from "express";

// const app = express();

// ; (async() => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on(error, (error) => {
//             console.log("error", error)
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`listening at ${process.env.PORT}`)
//         })
//     } catch(error) {
//         console.log("ERROR:", error)
//         throw error
//     }
// })()

