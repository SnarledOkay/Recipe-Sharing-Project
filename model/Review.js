const mongoose = require('mongoose')

const Recipe = require('./Recipe')

const ReviewSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Title is required'],
        minLength: 20,
        maxLength: 200
    },
    rating:{
        type:Number,
        required:[true,'Rating is required'],
        min: 1,
        max: 5
    },
    description:{
        type:String,
        maxLength: 1000,
    },
    user:{
        type: mongoose.Types.ObjectId,
        ref:'User',
        required:true
    },
    recipe:{
        type: mongoose.Types.ObjectId,
        ref:'Recipe',
        required:true
    }
},{timestamps:true})

ReviewSchema.statics.calculateAverageRating = async function(next){
    //The sequence of data aggregations operations are called a "pipeline"
    const rating = await this.db.collection.aggregate([
        {$match:{recipe:this.recipe}},
        {$group:{
            _id:'$recipe',
            averageRating:{$avg:'$rating'},
            numOfReviews:{$sum:1}
        }}
    ])
    console.log(rating)
    try{
        //the result we're looking for (already grouped) is pushed to the start
        //Others that matches by '$match' follows after
        //That's why we use 'rating[0]'
        await Recipe.findOneAndUpdate({_id:this.recipe},{
            averageRating:rating[0]?.averageRating || 0.0,
            numberOfReviews:rating[0]?.numOfReviews || 0,
        })
    }catch(error){
        console.log(error)
    }
    next()
}

//updates average rating if review is modified
ReviewSchema.post('save',async function(){
    await this.constructor.calculateAverageRating(this.recipe);
})
//updates recipe AFTER review is saved / removed
ReviewSchema.post('remove',async function(){
    await this.constructor.calculateAverageRating(this.recipe);
})

module.exports = mongoose.model('Review',ReviewSchema)