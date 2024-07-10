const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique:true},
    password: {type: String, required: true, minlength: 6},
    phone: {type: String},
    friends: [{type: mongoose.Types.ObjectId, ref: 'User'}],
});

userSchema.index({ unique: true });
// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);