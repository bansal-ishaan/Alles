import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})

connectDB()

.then(() => {
    app.on("error" , (error) => {
        console.log("err:",error);
        throw error
        
    })

    app.listen(process.env.PORT || 8000 , () => {
        console.log(`server is running at ${process.env.PORT}`);
    })
})

.catch ((error) => {
   console.log("MONGODB CONNECTION FAILER ! ! !",error);
})








/*
(async () =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("ERRR:",error);
            throw error
        })
        app.listen(process.env.PORT,() => {
            console.log(`app is listning on ${process.env.PORT}`)
        })
    }
    catch{
        console.error("ERROR:",error)
        throw err
    }
} )

*/ 