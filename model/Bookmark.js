const mongoose = require('mongoose')

const BookmarkSchema = new mongoose.Schema({
    user:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true,
    },
    recipe:{
        type:mongoose.Types.ObjectId,
        ref:'recipe',
        required:true
    }
},{timestamps:true})

module.exports = mongoose.model('Bookmark',BookmarkSchema);