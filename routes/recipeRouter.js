
const express = require('express')
const router = express.Router()

const {
    getAllRecipes,searchByIngredientList,
    getSingleRecipe,
    createRecipe,
    updateRecipe, updateIngredientList,
    deleteRecipe,
    uploadImage,
    getSubstituteIngredients,
    updateSubstituteIngredientList
} = require('../controllers/recipeController')

const {authenticateUser} = require('../middleware/authentication')

router.route('/advanced-search').post(searchByIngredientList);
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
    .post(updateSubstituteIngredientList)

module.exports = router