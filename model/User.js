const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true,'Name is required'],
        maxLength: 30,
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
        minLength:6,
        maxLength:20,
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

//Use bcryptjs because it is designed to be slow to decode -> hack-resistant
//If hashed -> faster to decode -> less-resistant
UserSchema.pre('save',async function(){
    if(this.isModified('password')){
        //add 'await' or else bcryptjs is receiving a Promise
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password,salt) 
    }
})

// UserSchema.methods.comparePassword = async function(providedPassword){
//     return await bcryptjs.compare(providedPassword,this.password);
// }

module.exports = mongoose.model('User',UserSchema);