//0 - dotenv
require('dotenv').config()

//1 - universal dependencies
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload');

const morgan = require('morgan')

const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,
})

//2 - connectDB
const connectDB = require('./db/connect')

//3 - Import routers
const authRouter = require('./routes/authRouter')
const recipeRouter = require('./routes/recipeRouter')
const reviewRouter = require('./routes/reviewRouter')

//4 - import middlewares
const errorHandlerMiddleware = require('./middleware/error-handler')
const notFoundMiddleware = require('./middleware/not-found')

//5 - Set up middleware
app.use(express.json())
app.use(cookieParser(process.env.JWT_SECRET))
app.use(fileUpload({useTempFiles:true}));
app.use(morgan('tiny'))

//6 - Set up routes
app.use('/api/v1/auth',authRouter)
app.use('/api/v1/recipe', recipeRouter)
app.use('/api/v1/review', reviewRouter)

//7 - error handler middleware (must be last)
//if any route matches, user has already been directed
//only not-found paths will run this code
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

//8 - start server
const port = process.env.PORT || 3000
const start = async () => {
    try{
        await connectDB(process.env.MONGO_URI)
        app.listen(port,()=>{
            console.log('Server is listening on port 3000...')
        })
    }catch(error){
        console.log(error)
    }
}

start()