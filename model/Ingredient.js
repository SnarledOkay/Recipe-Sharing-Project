const mongoose = require('mongoose')
const CustomError = require('../errors')

const IngredientSchema = new mongoose.Schema({
    ingredient:{
        type:String,
        required:true,
        maxLength:50
    },
    amount:{
        type: Number,
        required:true
    },
    unit:{
        type:String,
        enums:['g','kg','ml','l','tsp','tbsp'],
        required:true
    },
    totalAmount:{
        type: Number,
    },
    recipe:{
        type:mongoose.Types.ObjectId,
        ref:'Recipe',
        required:true
    },
    subsituteFor:{
        type:mongoose.Types.ObjectId,
        ref:'Ingredient',
    }
})

IngredientSchema.pre('save',async function(next){
    if(this.amount === null || this.unit === null){
        throw new CustomError.BadRequestError('Amount and unit of an ingredient is missing')
    }
    if(this.unit === 'kg' || this.unit === 'l') this.totalAmount = this.amount * 1000;
    else this.totalAmount = this.amount;
    //prolly no need to check if substitute conflicts
    next()
})

module.exports = mongoose.model('Ingredient',IngredientSchema)



