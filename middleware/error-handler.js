
const {StatusCodes} = require('http-status-codes')

const errorHandlerMiddleware = (err,req,res,next) => {
    //Parse every thrown errors into a form
    let customError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong, please try again later'
    }
    //Check 3 errors when uploading to MongoDB

    //Validation error - Information provided doesn't satisfy required conditions
    if(err.name === 'ValidationError'){
        customError.msg = Object.values(err.errors)
            .map((item)=>item.message)
            .join(',');
        customError.statusCode = 400
    }

    //Duplicate value entered for a field that already exists
    //Eg: trying to register with an email that has already been used
    if(err.code && err.code === 11000){
        customError.msg = `Duplicate value entered for ${Object.keys(
            err.keyValue
        )} field, please choose another value`;
        customError.statusCode = 400
    }

    //triggered when query conditions does not fit what MongoDB is looking for
    if(err.name === 'CastError'){
        customError.msg = `No item found with id: ${err.value}`;
        customError.statusCode = 404
    }
    return res.status(customError.statusCode).json({msg:customError.msg})
}

module.exports = errorHandlerMiddleware