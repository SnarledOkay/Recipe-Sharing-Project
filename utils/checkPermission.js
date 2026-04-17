
const CustomError = require('../errors')
const checkPermission = (requestUser,resourceUserId) => {
    if(requestUser.role === 'admin') return;
    if(requestUser.userId === resourceUserId) return;
    throw new CustomError.UnauthorizedError('Unauthorized to modify this data')
}

const checkOwnerPermission = (requestUser,resourceUserId) => {
    if(requestUser.userId === resourceUserId) return;
    throw new CustomError.UnauthorizedError('Not allowed to modify this data')
}

module.exports = {
    checkPermission,
    checkOwnerPermission
}