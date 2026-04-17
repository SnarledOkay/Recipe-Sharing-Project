
const express = require('express')
const router = express.Router()

const {
    getAllRecipes,
    getSingleRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadImage
} = require('../controllers/recipeController')

router.route('/')
    .get(getAllRecipes)
    .post(createRecipe)
router.route('/:id/upload-image').post(uploadImage)
router.route('/:id')
    .get(getSingleRecipe)
    .patch(updateRecipe)
    .delete(deleteRecipe)


module.exports = router