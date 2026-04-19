
const express = require('express')
const router = express.Router()

const {
    getAllRecipes,
    getSingleRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadImage,
    getSubstituteIngredients,
    addSubstituteIngredients,
    updateSubstituteIngredients,
    deleteSubstituteIngredients
} = require('../controllers/recipeController')

router.route('/')
    .get(getAllRecipes)
    .post(createRecipe)
router.route('/:id/upload-image').post(uploadImage)
router.route('/:id')
    .get(getSingleRecipe)
    .patch(updateRecipe)
    .delete(deleteRecipe)
router.route('/:recipeId/:ingredientId')
    .get(getSubstituteIngredients)
    .post(addSubstituteIngredients)
router.route('/:recipeId/:ingredientId/:subIngredientId')
    .patch(updateSubstituteIngredients)
    .delete(deleteSubstituteIngredients)

module.exports = router