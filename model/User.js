const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true,'Name is required'],
        minLength: 6,
        maxLength: 20,
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        validate:{
            validator: validator.isEmail,
            message:'Please provide a valid email'
        }
    },
    password:{
        type:String,
        required:[true,'Password is required'],
    },
    role:{
        type:String,
        required:true,
        enums: ['User','Admin'],
        default:'User'
    },
    isVerified:{
        type:Boolean,
        default:false,
    },
    verifiedAt:{
        type:Date,
    },
    verificationToken:{
        type:String,
    },
    passwordResetToken:{type:String},
    passwordResetTokenExpiration:{type:Date},
},{timestamps:true})

UserSchema.pre('save',async function(){
    if(!this.isModified) return
    const salt = bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password,salt)
})

UserSchema.method.createJWT = function(){
    const token = jwt.sign({
        userId: this._id,
        name: this.name,
        role: this.role,
    },process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_LIFETIME
    })
    return token
}

UserSchema.method.comparePassword = async function(providedPassword){
    const isMatch = bcryptjs.compare(providedPassword,this.password)
    return isMatch;
}

module.exports = mongoose.model('User',UserSchema);