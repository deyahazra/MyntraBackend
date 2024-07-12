// Environment Variable Configuration
require('dotenv').config();

// Third party imports
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Local imports
const HttpError = require('../models/http-error');
const User = require('../models/users');
const Notification = require('../models/notifications');
const Wishlist = require('../models/wishlist');
const Post = require('../models/post');
const Score = require('../models/score');
const blobToBase64 = require('../utils/blob-base64');



//-----------------------Controllers-----------------------//


const signup = async (req, res, next) => {
    // Extracting data from the request
    const {name, email, password} = req.body;

    // Checking if the user already exists
    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    }
    catch(err){
        const error = new HttpError('Signup failed, please try again later!', 500);
        return next(error);
    }

    if(existingUser){
        const error = new HttpError('User already exists, please login instead!', 422);
        return next(error);
    }

    // Hashing the password
    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password, 12);
    }
    catch(err){
        const error = new HttpError('Could not create user, please try again!', 500);
        return next(error);
    }

    // Creating a new user
    const createdUser = new User({
        name,
        email,
        password: hashedPassword
    });


    // Saving the user to the database
    try{
        await createdUser.save();
    }
    catch(err){
        const error = new HttpError('Signup failed, please try again later!', 500);
        return next(error);
    }

    // Creating a token
    let token;
    try{
        token = jwt.sign(
            {userId: createdUser.id, email: createdUser.email},
            process.env.JWT_KEY,
            {expiresIn: '720h'}
        );
    }
    catch(err){
        const error = new HttpError('Signup failed, please try again later!', 500);
        return next(error);
    }

    // Sending the response
    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token});
}



const login = async (req, res, next) => {
    // Extracting data from the request
    const {email, password} = req.body;

    // Checking if the user exists
    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    }
    catch(err){
        const error = new HttpError('Login failed, please try again later!', 500);
        return next(error);
    }

    if(!existingUser){
        const error = new HttpError('Invalid credentials, could not log you in!', 403);
        return next(error);
    }

    // Checking if the password is correct
    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    }
    catch(err){
        const error = new HttpError('Could not log you in, please check your credentials and try again!', 500);
        return next(error);
    }

    if(!isValidPassword){
        const error = new HttpError('Invalid credentials, could not log you in!', 403);
        return next(error);
    }

    // Creating a token
    let token;
    try{
        token = jwt.sign(
            {userId: existingUser.id, email: existingUser.email},
            process.env.JWT_KEY,
            {expiresIn: '720h'}
        );
    }
    catch(err){
        const error = new HttpError('Login failed, please try again later!', 500);
        return next(error);
    }

    // Sending the response
    res.status(200).json({userId: existingUser.id, email: existingUser.email, token: token});
}
const addfriend = async (req, res, next) => {
    // Extracting data from the request
    const {userId, friendEmail} = req.body;

    // Checking if the user exists
    let existingUser;
    try{
        existingUser = await User.findById(userId);               
    }
    catch(err){
        const error = new HttpError('Could not add friend, please try again later!', 500);
        return next(error);
    }

    let friend;
    try{
        friend = await User.findOne
        ({
            email: friendEmail
        });
    }
    catch(err){
        const error = new HttpError('Could not add friend, please try again later!', 500);
        return next(error);
    }

    if(!existingUser || !friend){
        const error = new HttpError('User not found, please try again later!', 404);
        return next(error);
    }

    // Adding friend to the user's friend list
    try{
        friend.friends.push(existingUser);
        await friend.save();
        existingUser.friends.push(friend);
        await existingUser.save();
    }
    catch(err){
        const error = new HttpError('Could not add friend, please try again later!', 500);
        return next(error);
    }

    // Sending the response
    res.status(200).json({message: 'Friend added successfully!'});
}


const getNotifications = async (req, res, next) => {
    // Extracting data from the request from headers
    const userId = req.headers.authorization
    console.log(userId);
    let notifications;
    // Checking if the user exists
    try {
        notifications = await Notification.find({ userId: userId });
        // console.log(notifications);
    }
    catch(err){
        const error = new HttpError('Could not get notifications, please try again later!', 500);
        return next(error);
    }
    console.log(notifications);
    // Sending the response
    res.status(200).json({notifications: notifications});

        
}
const addPost= async (req, res, next) => {
    // Extracting data from the request
    const {userId, theme} = req.body;

    // Checking if the user exists
    let existingUser;
    try{
        existingUser= await User.findById(userId);
    }
    catch(err){
        const error = new HttpError('Could not add post, please try again later!', 500);
        return next(error);
    }

    if(!existingUser){
        const error = new HttpError('User not found, please try again later!', 404);
        return next(error);
    }

    let imageBase64;
    if (req.files.length == 0 || !req.files[0] || !req.files[0].mimetype.startsWith('image')) {
        console.log('No image found');
    }
    else {
        imageBase64 = await blobToBase64(req.files[0]);
        if (!imageBase64 && imageBase64 == "") {
            console.log('Error, No image found');
        }
    }


    // Creating a new post
    const post = new Post({
        userId,
        theme,
        image: imageBase64
    });

    // Saving the post to the database
    try{
        await post.save();
        // Update or create score entry for the user
        let scoreEntry = await Score.findOne({ userId: userId });
        if (scoreEntry) {
            scoreEntry.score += 100; // Update the score to 100
            await scoreEntry.save();
        } else {
            // If no score entry exists, create a new one with a score of 100
            const newScoreEntry = new Score({
                userId: userId,
                score: 100
            });
            try {
                await newScoreEntry.save();
            } catch (err) {
                const error = new HttpError('Could not add post, please try again later!', 500);
                return next(error);
            }
            // await newScoreEntry.save();
        }

    }
    catch(err){
        const error = new HttpError('Could not add post, please try again later!', 500);
        return next(error);
    }


    // Sending the response
    res.status(200).json({message: 'Post added successfully!', image: imageBase64, theme: theme, userId: userId});
}
const getScore= async (req, res, next) => {
    // Extracting data from the request
    const userId = req.headers.authorization

    // Checking if the user exists
    let existingUser;
    try{
        existingUser= await User.findById(userId);
    }
    catch(err){
        const error = new HttpError('Could not get score, please try again later!', 500);
        return next(error);
    }

    if(!existingUser){
        const error = new HttpError('User not found, please try again later!', 404);
        return next(error);
    }

    // Getting the score
    let score;
    try{
        score= await Score.findOne({userId: userId});
    }
    catch(err){
        const error = new HttpError('Could not get score, please try again later!', 500);
        return next(error);
    }

    // Sending the response
    res.status(200).json({score: score.score});
}
const giveVote = async (req, res, next) => {
    // Extracting data from the request
    const {userId} = req.body;

    // Checking if the user exists
    let existingUser;
    try{
        existingUser= await User.findById(userId);
    }
    catch(err){
        const error = new HttpError('Could not add post, please try again later!', 500);
        return next(error);
    }

    if(!existingUser){
        const error = new HttpError('User not found, please try again later!', 404);
        return next(error);
    }


    // Getting the score
    let score;
    try {
        score = await Score.findOne({
            userId: userId
        });
    
        // Check if score exists, if not, create a new score with 50
        if (!score) {
            // Assuming Score is a Mongoose model, adjust accordingly if not
            score = new Score({
                userId: userId,
                score: 50 // Starting with a score of 50 if no score exists
            });
        } else {
            // If score exists, increase it by 50
            score.score += 50;
        }
    
        // Save the updated or new score
        await score.save();
    
    } catch (err) {
        const error = new HttpError('Could not update score, please try again later!', 500);
        return next(error);
    }
    
    // Sending the response with the updated score
    res.status(200).json({score: score.score});
}



const addToWishlist = async (req, res, next) => {
    
    // Extracting data from the request
    const {userId, productName, productPrice} = req.body;
    console.log(userId);
    let existingUser;
    //populate friends
    try{
        existingUser = await User.findById(userId).populate('friends');
    }
    catch(err){
        const error = new HttpError('Could not add to wishlist, please try again later-1!', 500);
        return next(error);
    }

    if(!existingUser){
        const error = new HttpError('User not found, please try again later!', 404);
        return next(error);
    }

    let name = existingUser.name;

    // Creating a new wishlist item
    const wishlistItem = new Wishlist({
        userId,
        email: existingUser.email,
        name,
        productName,
        productPrice
    });

    // notifying friends
    let friends;
    try{
        friends = existingUser.friends;
    }
    catch(err){
        const error = new HttpError('Could not add to wishlist, please try again later0!', 500);
        return next(error);
    }

    // console.log(friends[0].email);

    for(let i=0; i<friends.length; i++){
        const friend = friends[i];
        const notification = new Notification({
            userId: friend.id,
            email: friend.email,
            name: name,
            productName: productName,
            productPrice: productPrice
        });
        console.log(notification);

        // Saving the notification to the database
        try{
            await notification.save();

        }
        catch(err){
            const error = new HttpError('Could not add to wishlist, please try again later1!', 500);
            return next(error); 
        }

    }

    // Saving the wishlist item to the database
    try{
        await wishlistItem.save();
    }
    catch(err){
        const error = new HttpError('Could not add to wishlist, please try again later2!', 500);
        return next(error);
    }



    // Sending the response
    res.status(200).json({message: 'Added to wishlist successfully!'});
}








// Exporting
exports.signup = signup;
exports.login = login;
exports.addToWishlist = addToWishlist;
exports.addfriend = addfriend;
exports.getNotifications = getNotifications;
exports.addPost = addPost;
exports.getScore = getScore;
exports.giveVote = giveVote;