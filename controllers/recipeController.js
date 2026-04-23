
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const UtilityFunction = require('../utils')

const Recipe = require('../model/Recipe')
const Review = require("../model/Review")
const Ingredient = require('../model/Ingredient')

const getAllRecipes = async (req,res) => {
    //only searches by ingredient list 
    const {search,ingredientList} = req.query
    let foundRecipes = new Set();
    if(!search && !ingredientList){
        foundRecipes = await Recipe.find({});
    }else{
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
            JSON.parse(ingredientList);
            ingredientList.forEach(ingredient => {
                //find by ingredient, no limit set
                if(!ingredient.amount || !ingredient.unit){
                    //find all ingredients
                    const ingredients = Ingredient.find({ingredient:ingredient.ingredient})
                    ingredients.map(index => {foundRecipes.add(index.recipe)})
                }
                //find by ingredient, limit set
                else{
                    let totalAmount;
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

//Tested 
const getSingleRecipe = async (req,res) => {
    const {id:recipeId} = req.params
    const recipe = await Recipe.findById(recipeId).select('title description instruction averageRating numberOfReviews image')
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    //find by main ingredients only, not by substitute
    const ingredients = await Ingredient.find({recipe:recipeId,substituteFor:null}).select('ingredient amount unit')
    res.status(StatusCodes.OK).json({
        recipe,
        numOfIngredients:ingredients.length,
        ingredients
    })
}

//Tested and fixed
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
            recipe.deleteOne()
            throw new CustomError.BadRequestError('Ingredient or its amount and/or unit is missing')
        }else{
            //Creates new ingredient if correct
            Ingredient.create({ingredient,amount,unit,recipe:recipe._id,toUpdate:true})
        }
    }
    const numOfIngredients = ingredientList.length ;
    res.status(StatusCodes.OK).json({
        recipe:{
            title:recipe.title,
            description:recipe.description,
            numOfIngredients
        },
        msg:'Recipe created successfully!'
    })
}

//Update text information of Recipe
//Tested
const updateRecipe = async (req,res) => {
    const{
        params: {id:recipeId},
        body: {title,instruction,description}
    } = req
    if(!title || !instruction){
        throw new CustomError.BadRequestError('Title or instruction is missing')
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
    await recipe.save()
    const numOfIngredients = await Ingredient.countDocuments({recipe:recipe._id})
    res.status(StatusCodes.OK).json({
        recipe:{
            title:recipe.title,
            description:recipe.description,
            numOfIngredients
        },
        msg:'Recipe updated successfully!'
    })
}

//Update ingredient list of Recipe
//Tested and fixed
const updateIngredientList = async (req,res) => {
    const{
        params:{recipeId},
        body:{ingredientList}
    } = req
    if(!ingredientList){
        throw new CustomError.BadRequestError('Please provide list of ingredients')
    }
    const recipe = await Recipe.findById(recipeId).select('title description instruction user')
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    UtilityFunction.checkOwnerPermission(req.user,recipe.user.toString());
    //Check if list of ingredients are valid
    for(var i = 0; i < ingredientList.length;i++){
        if(!ingredientList[i].ingredient || !ingredientList[i].amount || !ingredientList[i].unit){
            throw new CustomError.BadRequestError('Name, amount or unit of some ingredient is missing')
        }
        //In production, every ingredient is provided to update
        //Just needs to check if any name is repeated in the list
        for(var j = 0; j < ingredientList.length; j++){
            if(i === j) continue;
            if(ingredientList[i].status === 'deleted' || ingredientList[i].status === 'deleted') continue;
            if(ingredientList[i].ingredient === ingredientList[j].ingredient){
                throw new CustomError.DuplicatedEntityError('Ingredient has already been registered');
            } 
        }
    }
    //Modify / Create ingredients
    for(var i = 0 ; i < ingredientList.length;i++){
        //If ingredient is newly added -> no ID yet
        if(ingredientList[i].status === 'created'){
            const {ingredient,amount,unit} = ingredientList[i]
            await Ingredient.create({ingredient,amount,unit,recipe:recipeId,status:'updated'})
        }
        //If ingredient is 'updated' -> update info even if no new info is provided
        else if(ingredientList[i].status === 'updated'){
            const {_id:ingredientId,ingredient,amount,unit} = ingredientList[i]
            const updatedIngredient = await Ingredient.findById(ingredientId)
            updatedIngredient.ingredient = ingredient;
            updatedIngredient.amount = amount;
            updatedIngredient.unit = unit;
            await updatedIngredient.save();
        }
        //if ingredient is deleted -> delete info
        else{
            const {_id:ingredientId} = ingredientList[i]
            await Ingredient.findByIdAndDelete(ingredientId)
        }
    }
    const ingredients = await Ingredient.find({recipe:recipeId,substituteFor:null}).select('ingredient amount unit')
    const numOfIngredients = await Ingredient.countDocuments({recipe:recipeId,substituteFor:null});
    res.status(StatusCodes.OK).json({
        recipe,
        numOfIngredients,
        ingredients
    })
}

//Tested and fixed
const deleteRecipe = async (req,res) => {
    const {id:recipeId} = req.params
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Target recipe cannot be found')
    }
    UtilityFunction.checkPermission(req.user,recipe.user)
    await recipe.deleteOne();
    res.status(StatusCodes.OK).json({msg:'Recipe deleted successfully!'})
}

const uploadImage = async (req,res) => {
    res.status(StatusCodes.OK).send('Image uploaded successfully!')
}

//CRUD substitute ingredients 
const getSubstituteIngredients = async (req,res) => {
    const {recipeId,ingredientId} = req.query
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    const ingredient = await Ingredient.findById(ingredientId)
    if(!ingredient){
        throw new CustomError.NotFoundError('Ingredient cannot be found')
    }
    const substituteIngredients = await Ingredient.find({subsituteFor:ingredientId,recipe:recipeId}).select('ingredient amount')
    if(!substituteIngredients){
        throw new CustomError.NotFoundError('There is no substitute for this ingredient')
    }
    const numOfSubIngredients = await Ingredient.countDocuments({subsituteFor:ingredientId,recipe:recipeId})
    res.status(StatusCodes.OK).json({
        substituteIngredients,
        numOfSubIngredients
    })
}

const addSubstituteIngredients = async (req,res) => {
    const{
        query:{recipeId,ingredientId},
        body:{ingredient,amount,unit}
    } = req
    //check for presence of information
    if(!ingredient || !amount || !unit){
        throw new CustomError.NotFoundError('Substitute ingredient or its amount and/or unit is missing')
    }
    //check if both targets exist
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    const updatedIngredient = await Ingredient.findById(ingredientId)
    if(!updatedIngredient){
        throw new CustomError.NotFoundError('Ingredient cannot be found')
    }
    //check if substitute ingredient has been created before
    const isIngredientTaken = await Ingredient.find({substituteFor:ingredientId,ingredient:ingredient})
    if(isIngredientTaken){
        throw new CustomError.DuplicatedEntityError('Substitute ingredient has already been created')
    }
    //create substitute ingredient
    const subIngredient = await Ingredient.create({
        ingredient,
        amount,
        unit,
        recipe:recipeId,
        substituteFor:ingredientId
    })
    res.status(StatusCodes.CREATED).json({
        subIngredient:{
            ingredient:subIngredient.ingredient,
            amount: subIngredient.amount,
            unit: subIngredient.unit
        },
        msg:'Substitute ingredient added successfully!'
    })
}

const updateSubstituteIngredients = async (req,res) => {
    const {
        query: {recipeId,ingredientId,subIngredientId},
        body: {ingredient,amount,unit}
    } = req
    if(!ingredient || !amount || !unit){
        throw new CustomError.BadRequestError('Substitute or its amount and/or unit is missing')
    }
    const recipe = await Recipe.findById(recipeId)
    const updatedIngredient = await Ingredient.findById(ingredientId)
    const subIngredient = await Ingredient.findById(subIngredientId)
    if(!recipe) throw new CustomError.NotFoundError('Recipe cannot be found');
    if(!updatedIngredient) throw new CustomError.NotFoundError('Ingredient cannot be found');
    if(!subIngredient) throw new CustomError.NotFoundError('Substitute ingredient cannot be found');
    //update new information
    const isIngredientTaken = await Ingredient.find({substituteFor:ingredientId,ingredient:ingredient})
    if(isIngredientTaken) throw new CustomError.DuplicatedEntityError('Substitute ingredient has already been created');
    //update new information
    subIngredient.ingredient = ingredient;
    subIngredient.amount = amount;
    subIngredient.unit = unit;
    await subIngredient.save();
    res.status(StatusCodes.OK).json({
        subIngredient:{
            subIngredient: ingredient,
            subIngredient: amount,
            subIngredient: unit,
        },
        msg:'Substitute ingredient has been updated!'
    })
}

const deleteSubstituteIngredients = async (req,res) => {
    const {recipeId,ingredientId,subIngredientId} = req.query
    const recipe = await Recipe.findById(recipeId)
    const ingredient = await Ingredient.findById(ingredientId)
    if(!recipe) throw new CustomError.NotFoundError('Recipe cannot be found');
    if(!ingredient) throw new CustomError.NotFoundError('Ingredient cannot be found');
    UtilityFunction.checkOwnerPermission(req.user,recipe.user)
    const subIngredient = await Ingredient.findOneAndDelete({_id:subIngredientId})
    if(!subIngredient){
        throw new CustomError.NotFoundError('Cannot find substitute ingredient to delete')
    }
    res.status(StatusCodes.OK).json({msg:'Substitute ingredient deleted successfully!'})
}

module.exports = {
    getAllRecipes,
    getSingleRecipe,
    createRecipe,
    updateRecipe,
    updateIngredientList,
    deleteRecipe,
    uploadImage,
    getSubstituteIngredients,
    addSubstituteIngredients,
    updateSubstituteIngredients,
    deleteSubstituteIngredients
}