
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const UtilityFunction = require('../utils')

const Recipe = require('../model/Recipe')
const Review = require("../model/Review")
const Ingredient = require('../model/Ingredient')

const getAllRecipes = async (req,res) => {
    //only searches by ingredient list 
    const {search,ingredientList} = req.body
    let foundRecipes = new Set();
    if(search){
        //find recipes based on title, description or instruction
        foundRecipes = Recipe.find({
            $or:[
                {title:{$regex:search,$options:'i'}},
                {description:{$regex:search,$options:'i'}},
                {instruction:{$regex:search,$options:'i'}}
            ]
        });
    }else{
        //find recipes based on ingredient list 
        JSON.parse(ingredientList)
        ingredientList.forEach(ingredient => {
            //find by ingredient, no limit set
            if(!ingredient.amount || !ingredient.unit){
                //find all ingredients
                const ingredients = Ingredient.find({ingredient:ingredient.ingredient})
                ingredients.map(index => {foundRecipes.add(index.recipe)})
            }
            //find by ingredient, limit set
            else{
                const totalAmount;
                if(unit === 'kg' || unit === 'l') totalAmount = ingredient.amount*1000;
                else totalAmount = ingredient.amount ;
                const ingredients = Ingredient.find({ingredient:ingredient.ingredient,totalAmount:{$lte:totalAmount}})
                ingredients.map(index => {foundRecipes.add(index.recipe)})
            }
        });
        //convert Set of recipeId into Set of recipes
        for(var i = 0; i < foundRecipes.length;i++){
            foundRecipes[i] = Recipe.findById(foundRecipes[i])
        }
    }
    //Sort according to user's choice
    const sort = req.query
    if(sort === 'a-z') foundRecipes.sort();
    if(sort === 'z-a') foundRecipes.sort();
    if(sort === 'Oldest to Latest') foundRecipes.sort('createdAt');
    if(sort === 'Latest to Oldest') foundRecipes.sort('-createdAt');
    if(sort === 'Lowest to Highest Rated') foundRecipes.sort('averageRating');
    if(sort === 'Highest to Lowest Rated') foundRecipes.sort('-averageRating');
    //Pagination according to user's choice
    const page = req.query || 1
    const limit = req.query || 15
    const skip = (page-1)*limit
    foundRecipes.skip(skip).limit(limit)

    const resultRecipes = await foundRecipes;
    const numOfRecipes = resultRecipes.length
    const numOfPages = Math.ceil(numberOfRecipes/limit) || 1

    res.status(StatusCodes.OK).json({resultRecipes,numOfRecipes,numOfPages})
}

const getSingleRecipe = async (req,res) => {
    const {id:recipeId} = req.params
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    res.status(StatusCodes.OK).json({recipe})
}

const createRecipe = async (req,res) => {
    //check presence of all information
    const {title,instruction,ingredientList} = req.body
    if(!title || !instruction || !ingredientList){
        throw new CustomError.BadRequestError('Title, instruction or ingredient list is missing')
    }
    //create new recipe, then deletes upon detecting errors in ingredients
    req.body.user = req.user.userId
    const recipe = await Recipe.create(req.body)
    //check ingredients validity
    for(var i = 0; i < ingredientList.length;i++){
        const {ingredient,amount,unit} = ingredientList[i]
        //If error, then delete the recipe immediately
        if(!ingredient || !amount || !unit){
            recipe.remove()
            throw new CustomError.BadRequestError('Ingredient or its amount and/or unit is missing')
        }else{
            //Creates new ingredient if correct
            Ingredient.create({ingredient,amount,unit,recipe:recipe._id})
        }
    }
    const numOfIngredients = await Ingredient.countDocuments({recipe:recipe._id})
    res.status(StatusCodes.OK).json({
        recipe:{
            title:recipe.title,
            description:recipe.description,
            numOfIngredients
        },
        msg:'Recipe created successfully!'
    })
}

const updateRecipe = async (req,res) => {
    const{
        params: {id:recipeId},
        body: {title,instruction,description,ingredientList}
    } = req
    if(!title || !instruction || !ingredientList){
        throw new CustomError.BadRequestError('Title, instruction or ingredient list is missing')
    }
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    UtilityFunction.checkPermission(req.user,recipe.user)
    //manually updates Recipe
    recipe.title = title
    recipe.description = description
    recipe.instruction = instruction
    recipe.ingredientList = ingredientList
    await recipe.save()
    
    res.status(StatusCodes.OK).json({
        recipe:{
            title:recipe.title,
            description:recipe.description,
            numberOfIngredients:ingredientList.length
        },
        msg:'Recipe updated successfully!'
    })
}

const deleteRecipe = async (req,res) => {
    const {id:recipeId} = req.params
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Target recipe cannot be found')
    }
    UtilityFunction.checkPermission(req.user,recipe.user)
    await recipe.remove();
    res.status(StatusCodes.OK).json({msg:'Recipe deleted successfully!'})
}

const uploadImage = async (req,res) => {
    res.status(StatusCodes.OK).send('Image uploaded successfully!')
}

module.exports = {
    getAllRecipes,
    getSingleRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadImage
}