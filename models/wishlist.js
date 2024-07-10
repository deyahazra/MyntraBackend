const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    email: {type: String, required: true},
    name : {type: String, required: true},
    productName : {type: String, required: true},
    productPrice : {type: String, required: true}
});


// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Wishlist', userSchema);
