
const crypto = require('crypto')

//'randomBytes' creates a random string, not hashed
//'createHash' hashes the string in an one-way process
const createHash = (string) => {
    //updates the hash content with given data (string)
    //if encoding is not provided and data is string, 'utf8' is enforced
    return crypto.createHash('md5').update(string).digest('hex')
    //'digest' is the output generated from a hash table, and has fized size for any hash function
    //'.digest()' calculates the digest of all data passed to be hashed
    //if encoding is provided, returns a string
}

module.exports = createHash