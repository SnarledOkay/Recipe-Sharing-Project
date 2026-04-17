
const {StatusCodes} = require('http-status-codes')
const CustomAPIError = require('./custom-api')

class UniqueConflictError extends CustomAPIError{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.NOT_ACCEPTABLE
    }
}

module.exports = UniqueConflictError