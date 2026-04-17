const mongoose = require('mongoose')

const TempIngredientSchema = new mongoose.Schema({
    ingredient:{
        type:String,
        required:true,
        maxLength:50
    },
    amount:{
        type:Number,
        required:true,
    },
    unit:{
        type:String,
        enums:['g','kg','ml','l','tsp','tbsp'],
        default:'g',
        required:true,
    }
})

module.exports = mongoose.model('TempIngredient',TempIngredientSchema)