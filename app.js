import express from "express"
import fetch from "node-fetch";
import path from "path"
import fs from "fs"
const app = express();


app.use(express.static('public'))
app.listen(3000, () =>{
    console.log("server started at port 3000");

});


app.get("/", (req, res) => 
{
    console.log("here");
    console.log(process.cwd())
    res.sendFile(process.cwd() + "/index.html")
});