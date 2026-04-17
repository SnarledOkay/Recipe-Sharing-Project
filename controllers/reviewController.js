
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const UtilityFunction = require('../utils')

const Recipe = require('../model/Recipe')
const Review = require('../model/Review')

const getAllProductReviews = async (req,res) => {
    const {recipeId} = req.query
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    const reviews = await Recipe.find({recipe:recipeId}).select('title rating user')
    res.status(StatusCodes.OK).json({reviews})
}

const getSingleReview = async (req,res) => {
    const {reviewId} = req.query
    const review = await Review.findById(reviewId)
    if(!review){
        throw new CustomError.NotFoundError('Review cannot be found')
    }
    res.status(StatusCodes.OK).json({review})
}

const createReview = async (req,res) => {
    const {
        query:{recipeId},
        body:{title,rating,description}
    }
    if(!title || !rating || !description){
        throw new CustomError.BadRequestError('Please provide all necessary information')
    }
    const recipe = await Recipe.findById(recipeId);
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    const hasUserReviewed = await Review.find({user:req.user.userId,recipe:recipeId})
    if(hasUserReviewed){
        throw new CustomError.DuplicatedEntityError('Recipe has already been reviewed')
    }
    req.body.user = req.user.userId
    req.body.recipe = recipeId
    const review = await Review.create(req.body)
    res.status(StatusCodes.OK).json({
        review:{
            title:review.title,
            rating:review.rating,
            description:review.description
        },
        msg:'Review created successfully!'
    })
}

const updateReview = async (req,res) => {
    const {reviewId} = req.query
    const review = await Review.findById(reviewId)
    if(!review){
        throw new CustomError.NotFoundError('Review cannot be found')
    }
    UtilityFunction.checkOwnerPermission(req.user,review.user)
    review.title = req.body.title;
    review.rating = req.body.rating;
    review.description = req.body.description
    await review.save()

    res.status(StatusCodes.OK).json({
        review:{
            title:review.title,
            rating:review.rating,
            description:review.description
        },
        msg:'Review updated successfully!'
    })
}

const deleteReview = async (req,res) => {
    const {reviewId} = req.query
    const review = await Review.findById(reviewId)
    if(!review){
        throw new CustomError.NotFoundError('Review cannot be found')
    }
    UtilityFunction.checkPermission(req.user,review.user)
    await review.delete()

    res.status(StatusCodes.OK).json({msg:'Review deleted successfully!'})
}

module.exports = {
    getAllProductReviews,
    getSingleReview,
    createReview,
    updateReview,
    deleteReview
}