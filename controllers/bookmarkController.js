
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const Bookmark = require('../model/Bookmark')
const Recipe = require('../model/Recipe')

const getAllBookmarkRecipe = async (req,res) => {
    const {userId} = req.user
    const bookmarks = await Bookmark.find({user:userId}).select('-_id recipe');
    let recipeIds = [];
    for(const bookmark of bookmarks){
        recipeIds.push(bookmark.recipe)
    }
    const recipes = await Recipe.find({_id:{$in:recipeIds}}).select('title description instruction averageRating numberOfReviews createdAt user');
    if(!recipes){
        throw new CustomError.NotFoundError('You have not bookmarked any recipe yet!')
    }
    const numOfBookmarks = await Bookmark.countDocuments({user:userId});
    res.status(StatusCodes.OK).json({recipes,numOfBookmarks})
}

const addRecipeToBookmark = async (req,res) => {
    const {
        params:{recipeId},
        user:{userId}
    } = req;
    const recipe = await Recipe.findById(recipeId);
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found!')
    }
    const isRecipeBookmarked = await Bookmark.findOne({user:userId,recipe:recipeId});
    if(isRecipeBookmarked){
        throw new CustomError.DuplicatedEntityError('Recipe has already been bookmarked!')
    }
    await Bookmark.create({user:userId,recipe:recipeId});
    res.status(StatusCodes.OK).json({msg:'Recipe bookmarked!'})
}

const removeRecipeFromBookmark = async (req,res) => {
    const {
        params:{recipeId},
        user:{userId}
    } = req;
    const recipe = await Recipe.findById(recipeId);
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found!')
    }
    const isRecipeBookmarked = await Bookmark.findOne({user:userId,recipe:recipeId});
    if(!isRecipeBookmarked){
        throw new CustomError.DuplicatedEntityError('Recipe has not been bookmarked!')
    }
    await Bookmark.findOneAndDelete({user:userId,recipe:recipeId});
    res.status(StatusCodes.OK).json({msg:'Recipe removed from bookmark!'})
}

module.exports = {
    getAllBookmarkRecipe,
    addRecipeToBookmark,
    removeRecipeFromBookmark
}
