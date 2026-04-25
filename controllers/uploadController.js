
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const path = require('path')
const cloudinary = require('cloudinary').v2

const uploadRecipeImageLocal = async (req,res) => {
    if(!req.files || !req.files.image){
        throw new CustomError.BadRequestError('No image provided')
    }
    const recipeImage = req.files.image;
    if(!recipeImage.startsWith('image')){
        throw new CustomError.BadRequestError('Please provide a file of type Image')
    }
    const maxSize = 4098 //1024kb
    if(recipeImage > maxSize){
        throw new CustomError.BadRequestError('Please provide file smaller than 4MB')
    }
    const imagePath = path.join(__dirname,'../public/uploads/'+`${recipeImage.name}`)
    await recipeImage.mv(imagePath)
    return res.status(StatusCodes.OK).json({image:{src:`/uploads/${recipeImage.name}`}})
}

const fs = require('fs')

const uploadRecipeImage = async (req,res) => {
    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath,{
        use_filename:true,
        folder:'file-upload',
    })
    fs.unlinkSync(req.files.image.tempFilePath)
    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}

module.exports = {
    uploadRecipeImage
}