const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    theme: {type: String, required: true},
    image: {type: String},
});


// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Post', userSchema);