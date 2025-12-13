import express from 'express';
import cors from 'cors'
import userRouter from './routes/user'
import adminRouter from './routes/admin'
import { config } from 'dotenv';
config();
const app = express()
app.use(express.json());
app.use("/user",userRouter);
app.use("/admin",adminRouter)
app.use(cors());

app.listen(process.env.PORT||3000, () => {
    console.log('Server is running on port 3000')
})