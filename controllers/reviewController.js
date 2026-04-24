
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const UtilityFunction = require('../utils')

const Recipe = require('../model/Recipe')
const Review = require('../model/Review')

//Tested, modified and fixed
const getAllRecipeReviews = async (req,res) => {
    const {recipeId} = req.params
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    let reviews = Review.find({recipe:recipeId}).select('title rating user createdAt');
    const sort = req.query.sort;
    if(sort === 'oldest-latest') reviews.sort('createdAt');
    if(sort === 'latest-oldest') reviews.sort('-createdAt');
    if(sort === 'highest-lowest') reviews.sort('-rating -createdAt');
    if(sort === 'lowest-highest') reviews.sort('rating -createdAt');

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page-1)*limit;
    reviews.skip(skip).limit(limit);

    const allReviews = await reviews;
    const numOfReviews = await Review.countDocuments({recipe:recipeId});
    const numOfPages = Math.ceil(numOfReviews/limit) || 1;
    res.status(StatusCodes.OK).json({
        allReviews,
        averageRating:recipe.averageRating,
        numOfReviews,
        numOfPages,
    })
}

//Tested (no error)
const getSingleReview = async (req,res) => {
    const {reviewId} = req.params
    const review = await Review.findById(reviewId).select('title rating description user createdAt')
    if(!review){
        throw new CustomError.NotFoundError('Review cannot be found')
    }
    res.status(StatusCodes.OK).json({review})
}

//Tested (no error)
const getCurrentUserReview = async (req,res) => {
    const {recipeId} = req.params
    const review = await Review.findOne({recipe:recipeId,user:req.user.userId}).select('title rating description createdAt')
    if(!review){
        throw new CustomError.NotFoundError('You have not reviewed this recipe yet!')
    }
    res.status(StatusCodes.OK).json({review});
}

//Tested and fixed
const createReview = async (req,res) => {
    const {
        params:{recipeId},
        body:{title,rating,description}
    } = req
    if(!title || !rating || !description){
        throw new CustomError.BadRequestError('Please provide all necessary information')
    }
    let recipe = await Recipe.findById(recipeId);
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    const hasUserReviewed = await Review.findOne({user:req.user.userId,recipe:recipeId})
    if(hasUserReviewed){
        throw new CustomError.DuplicatedEntityError('Recipe has already been reviewed!')
    }
    const review = await Review.create({
        title,rating,description,
        user:req.user.userId,
        recipe:recipeId
    });
    recipe = await Recipe.findById(recipeId);
    const numOfReviews = await Review.countDocuments({recipe:recipeId})
    res.status(StatusCodes.OK).json({
        review:{
            title:review.title,
            rating:review.rating,
            description:review.description
        },
        averageRating:recipe.averageRating,
        numOfReviews,
        msg:'Review created successfully!'
    })
}

//Tested and fixed
const updateReview = async (req,res) => {
    const{
        params:{recipeId},
        body:{title,rating,description}
    }=req
    if(!title || !rating || !description){
        throw new CustomError.BadRequestError('Title, rating or description is missing')
    }
    const review = await Review.findOne({recipe:recipeId,user:req.user.userId})
    if(!review){
        throw new CustomError.NotFoundError('You have not reviewed this recipe yet!')
    }
    review.title = req.body.title;
    review.rating = req.body.rating;
    review.description = req.body.description
    await review.save()

    const recipe = await Recipe.findById(recipeId);
    const numOfReviews = await Review.countDocuments({recipe:recipeId});

    res.status(StatusCodes.OK).json({
        msg:'Review updated successfully!',
        review:{
            title:review.title,
            rating:review.rating,
            description:review.description
        },
        averageRating:recipe.averageRating,
        numOfReviews, 
    })
}

//Tested and fixed
const deleteReview = async (req,res) => {
    const {recipeId,reviewId} = req.params
    const review = await Review.findById(reviewId)
    if(!review){
        throw new CustomError.NotFoundError('Review cannot be found')
    }
    UtilityFunction.checkPermission(req.user,review.user)
    await review.deleteOne();
    const recipe = await Recipe.findById(recipeId);
    const numOfReviews = await Review.countDocuments({recipe:recipeId});

    res.status(StatusCodes.OK).json({
        msg:'Review deleted successfully!',
        averageRating:recipe.averageRating,
        numOfReviews
    })
}

module.exports = {
    getAllRecipeReviews,
    getSingleReview,getCurrentUserReview,
    createReview,
    updateReview,
    deleteReview
}