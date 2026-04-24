
const express = require('express')
const router = express.Router()

const {
    getAllRecipeReviews,
    getSingleReview, getCurrentUserReview,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviewController')
const {authenticateUser} = require('../middleware/authentication')

router.route('/:recipeId/my-review')
    .get(authenticateUser,getCurrentUserReview)
    .patch(authenticateUser,updateReview)
router.route('/:recipeId/reviews/:reviewId')
    .get(getSingleReview)
    .delete(authenticateUser,deleteReview)
router.route('/:recipeId/reviews')
    .get(getAllRecipeReviews)
    .post(authenticateUser,createReview)

module.exports = router