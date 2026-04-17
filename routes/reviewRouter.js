
const express = require('express')
const router = express.Router()

const {
    getAllProductReviews,
    getSingleReview,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviewController')

router.route('/:recipeId/:reviewId')
    .get(getSingleReview)
    .patch(updateReview)
    .delete(deleteReview)
router.route('/:recipeId')
    .get(getAllProductReviews)
    .post(createReview)

module.exports = router