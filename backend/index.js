import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';

dotenv.config();    

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/",()=>{
    
})


mongoose.connect(
    process.env.MONGODB_URI
).then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('Failed to connect to MongoDB', err);
});