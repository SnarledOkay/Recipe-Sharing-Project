
const bcryptjs = require('bcryptjs')

const comparePassword = async (providedPassword,savedPassword) => {
    return await bcryptjs.compare(providedPassword,savedPassword);
}

module.exports = comparePassword