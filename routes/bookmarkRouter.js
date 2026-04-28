
const express = require('express')
const router = express.Router()

const {
    getAllBookmarkRecipe,
    addRecipeToBookmark,
    removeRecipeFromBookmark
} = require('../controllers/bookmarkController')
const {authenticateUser} = require('../middleware/authentication')

router.route('/').get(authenticateUser,getAllBookmarkRecipe)
router.route('/:recipeId')
    .post(authenticateUser,addRecipeToBookmark)
    .delete(authenticateUser,removeRecipeFromBookmark)

module.exports = router
