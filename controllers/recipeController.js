
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const UtilityFunction = require('../utils')

const Recipe = require('../model/Recipe')
const Review = require("../model/Review")
const Ingredient = require('../model/Ingredient')

//Tested and fixed
const getAllRecipes = async (req,res) => {
    //switch to getting information from 'req.body'
    const {search} = req.query
    let allRecipesIds = [];
    let foundRecipes;
    if(!search) foundRecipes = Recipe.find({});
    else{
        const matchedRecipes = await Recipe.find({
            $or:[
                {title:{$regex:search,$options:'i'}},
                {description:{$regex:search,$options:'i'}},
                {instruction:{$regex:search,$options:'i'}}
            ]
        },'_id') //only extract '_id' instead of the whole Recipe
        const matchedIngredients = await Ingredient.find({ingredient:{$regex:search,$options:'i'}})
        matchedRecipes.map(r => allRecipesIds.push(r))
        matchedIngredients.map(ingre => allRecipesIds.push(ingre.recipe.toString()))//convert ObjectId to String
        //Find all recipes provided in the array
        foundRecipes = Recipe.find({_id:{$in:allRecipesIds}})
    }
    //Sort according to user's choice
    const sort = req.query.sort
    if(sort === 'a-z') foundRecipes.sort({title:1});
    if(sort === 'z-a') foundRecipes.sort({title:-1});
    if(sort === 'oldest-latest') foundRecipes.sort('createdAt');
    if(sort === 'latest-oldest') foundRecipes.sort('-createdAt');
    if(sort === 'lowest-highest') foundRecipes.sort('averageRating');
    if(sort === 'highest-lowest') foundRecipes.sort('-averageRating');
    //Pagination according to user's choice
    const page = req.query.page || 1
    const limit = req.query.limit || 15
    const skip = (page-1)*limit
    foundRecipes.skip(skip).limit(limit)

    const resultRecipes = await foundRecipes;
    const numOfRecipes = resultRecipes.length
    const numOfPages = Math.ceil(numOfRecipes/limit) || 1

    res.status(StatusCodes.OK).json({resultRecipes,numOfRecipes,numOfPages})
}

//Tested and fixed
const searchByIngredientList = async (req,res) => {
    const {ingredientList} = req.body
    let allRecipesIds = [];
    //'forEach()' does not support 'async-await'
    //'for' loop, however, does
    for(const ingredient of ingredientList){
        //find by ingredient, no limit set
        if(!ingredient.amount || !ingredient.unit){
            //find all ingredients (not including substitutes)
            const ingredients = await Ingredient.find({ingredient:ingredient.ingredient})
            ingredients.map(index => allRecipesIds.push(index.recipe.toString()))
        }
        //find by ingredient, limit set
        else{
            let totalAmount;
            if(ingredient.unit === 'kg' || ingredient.unit === 'l') totalAmount = ingredient.amount*1000;
            else totalAmount = ingredient.amount ;
            const ingredients = await Ingredient.find({ingredient:ingredient.ingredient,totalAmount:{$lte:totalAmount}})
            ingredients.map(index => {allRecipesIds.push(index.recipe.toString())})
        }
    }
    const foundRecipes = Recipe.find({_id:{$in:allRecipesIds}});
    const sort = req.body.sort;
    if(sort === 'a-z') foundRecipes.sort({title:1});
    if(sort === 'z-a') foundRecipes.sort({title:-1});
    if(sort === 'oldest-latest') foundRecipes.sort({createdAt:1});
    if(sort === 'latest-oldest') foundRecipes.sort({createdAt:-1});
    if(sort === 'lowest-highest') foundRecipes.sort({averageRating:1});
    if(sort === 'highest-lowest') foundRecipes.sort({averageRating:-1});

    const page = req.body.page || 1
    const limit = req.body.limit || 15
    const skip = (page-1)*limit
    foundRecipes.skip(skip).limit(limit)

    const resultRecipes = await foundRecipes;
    const numOfRecipes = resultRecipes.length
    const numOfPages = Math.ceil(numOfRecipes/limit) || 1

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


const getSubstituteIngredients = async (req,res) => {
    const {recipeId,ingredientId} = req.params
    const recipe = await Recipe.findById(recipeId)
    if(!recipe){
        throw new CustomError.NotFoundError('Recipe cannot be found')
    }
    const ingredient = await Ingredient.findById(ingredientId)
    if(!ingredient){
        throw new CustomError.NotFoundError('Ingredient cannot be found')
    }
    const substituteIngredients = await Ingredient.find({substituteFor:ingredientId,recipe:recipeId}).select('ingredient amount unit')
    if(!substituteIngredients){
        throw new CustomError.NotFoundError('There is no substitute for this ingredient')
    }
    const numOfSubIngredients = await Ingredient.countDocuments({substituteFor:ingredientId,recipe:recipeId})
    res.status(StatusCodes.OK).json({
        substituteIngredients,
        numOfSubIngredients
    })
}

const updateSubstituteIngredientList = async (req,res) => {
    const{
        params:{recipeId,ingredientId},
        body:{ingredientList}
    } = req;
    const recipe = await Recipe.findById(recipeId);
    const updatedIngredient = await Ingredient.findById(ingredientId);
    if(!recipe) throw new CustomError.NotFoundError('Recipe cannot be found');
    if(!updatedIngredient) throw new CustomError.NotFoundError('Ingredient cannot be found');
    for(var i = 0; i < ingredientList.length;i++){
        const ingredient = ingredientList[i];
        if(!ingredient.ingredient || !ingredient.amount || !ingredient.unit){
            throw new CustomError.BadRequestError('Ingredient, amount or unit of some ingredient is missing')
        }
        if(ingredient.ingredient === updatedIngredient.ingredient){
            throw new CustomError.DuplicatedEntityError('Substitute ingredient must be different from original ingredient')
        }
        for(var j = 0;j < ingredientList.length;j++){
            if(i === j) continue;
            if(ingredient.ingredient === ingredientList[j].ingredient){
                throw new CustomError.DuplicatedEntityError('Some ingredient has been registered more than once')
            }
        }
    }
    for(const eachIngredient of ingredientList){
        const {ingredient,amount,unit,status} = eachIngredient;
        if(status === 'created'){
            await Ingredient.create({
                ingredient,amount,unit,
                status:'updated',
                recipe:recipeId,
                substituteFor:ingredientId,
            })
        } else if(status === 'updated'){
            const {_id:subIngredientId} = eachIngredient;
            const updatedSubIngredient = await Ingredient.findById(subIngredientId);
            updatedSubIngredient.ingredient = ingredient
            updatedSubIngredient.amount = amount
            updatedSubIngredient.unit = unit
            updatedSubIngredient.status = 'updated';
            await updatedSubIngredient.save();
        }else{
            const {_id:subIngredientId} = eachIngredient
            await Ingredient.findByIdAndDelete(subIngredientId)
        }
    }
    const subIngredients = await Ingredient.find({substituteFor:ingredientId}).select('ingredient amount unit');
    const numOfSubIngredients = await Ingredient.countDocuments({substituteFor:ingredientId});
    res.status(StatusCodes.OK).json({
        subIngredients,
        numOfSubIngredients
    })
}

module.exports = {
    getAllRecipes, searchByIngredientList,
    getSingleRecipe,
    createRecipe,
    updateRecipe,
    updateIngredientList,
    deleteRecipe,
    uploadImage,
    getSubstituteIngredients,
    updateSubstituteIngredientList
}