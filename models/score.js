const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    score: {type: Number, required: true,default:0},
});


// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Score', userSchema);