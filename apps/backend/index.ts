import express from 'express';
import cors from 'cors'
import {prismaClient} from "db/client"
const app = express()
app.post("/signin",(req,res)=>{

})
app.get("/calendar",authMiddleware,(req,res)=>{
    
})
app.use(cors());
app.listen(process.env.PORT||3000, () => {
    console.log('Server is running on port 3000')
})