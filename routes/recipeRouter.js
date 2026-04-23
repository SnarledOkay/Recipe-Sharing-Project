
const express = require('express')
const router = express.Router()

const {
    getAllRecipes,
    getSingleRecipe,
    createRecipe,
    updateRecipe, updateIngredientList,
    deleteRecipe,
    uploadImage,
    getSubstituteIngredients,
    addSubstituteIngredients,
    updateSubstituteIngredients,
    deleteSubstituteIngredients
} = require('../controllers/recipeController')

const {authenticateUser} = require('../middleware/authentication')

router.route('/')
    .get(getAllRecipes)
    .post(authenticateUser,createRecipe)
router.route('/:recipeId/upload-image').post(authenticateUser,uploadImage)
router.route('/:recipeId/ingredient-list').patch(authenticateUser,updateIngredientList)
router.route('/:id')
    .get(getSingleRecipe)
    .patch(authenticateUser,updateRecipe)
    .delete(authenticateUser,deleteRecipe)
router.route('/:recipeId/:ingredientId')
    .get(getSubstituteIngredients)
    .post(authenticateUser,addSubstituteIngredients)
router.route('/:recipeId/:ingredientId/:subIngredientId')
    .patch(authenticateUser,updateSubstituteIngredients)
    .delete(authenticateUser,deleteSubstituteIngredients)

module.exports = router