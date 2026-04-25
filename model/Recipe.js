const mongoose = require('mongoose')
const CustomError = require('../errors')

const Review = require('./Review')

//No longer need an ingredient list
const RecipeSchema = new mongoose.Schema({
    title:{
        type:String,
        required: [true,'Please provide title of recipe'],
        maxLength: 100,
    },
    description:{
        type:String,
        maxLength: 1000,
    },
    instruction:{
        type:String,
        required:[true,'Instruction for recipe is required'],
        maxLength: 5000,
    },
    user:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required:true
    },
    averageRating:{
        type:Number,
        default:0.0,
    },
    numberOfReviews:{
        type:Number,
        default:0,
    },
    image:{
        type:String,
        // required:true
    }
},{timestamps:true})

//Validate during creation, no ingredient list included anymore
// RecipeSchema.pre('save',async function(next){
//     const ingredientList = this.ingredientList
//     ingredientList.map(ingredient => {
//         if(ingredient.amount === null || ingredient.unit === null){
//             throw new CustomError.BadRequestError('Unit and amount is required for all ingredient')
//         }
//     })
//     next()
// })

RecipeSchema.pre('remove',async function(next){
    await Review.deleteMany({recipe:this._id})
    await Ingredient.deleteMany({recipe:this._id})
    next()
    //both codes are the same
    //await this.model('Review').deleteMany({ product: this._id });
})

module.exports = mongoose.model('Recipe',RecipeSchema)