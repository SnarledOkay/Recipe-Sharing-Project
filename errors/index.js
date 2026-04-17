const CustomAPIError = require('./custom-api')
const BadRequestError = require('./bad-request')
const DuplicatedEntityError = require('./duplicated-entity')
const NotFoundError = require('./not-found')
const UnauthenticatedError = require('./unauthenticated')
const UnauthorizedError = require('./unauthorized')
const UniqueConflictError = require('./unique-conflict')

module.exports = {
    CustomAPIError,
    BadRequestError,
    DuplicatedEntityError,
    NotFoundError,
    UnauthenticatedError,
    UnauthorizedError,
    UniqueConflictError
}