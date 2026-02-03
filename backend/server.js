import 'dotenv/config';
import routes from '../index.js';
const express=require('express');
const bodyParser=require('body-parser');
const cors=require('cors'); 
const app=express();
const PORT=process.env.PORT;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
app.use(cors());
app.use(bodyParser.json());
app.use(routes);

export default app;
