import express from "express";
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from "cors";
import db from "./config/database.js";
import router from './routes/index.js';
import Users from "./models/userModel.js"

// "nodemon"

dotenv.config();
const app = express();

try {
    await db.authenticate();
    console.log('Database Connected..');
    await Users.sync({alter: true});
} catch (error) {
    console.error(error);
}
app.use(cors({ credentials:true, origin:'http://localhost:3000'}));
app.use(cookieParser());
app.use(express.json());
app.use(router);

app.listen(5000, ()=> console.log('Server running at port 5000'));

