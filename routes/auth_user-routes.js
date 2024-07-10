// Third party imports
const express = require('express');
const {check} = require('express-validator');

// Local imports
const authUserController = require('../controllers/auth_user-controllers');
const checkAuth = require('../middlewares/check-auth');

// Initializing
const router = express.Router();


//-----------------------Routes-----------------------//


// @route   POST auth/signup
router.post(
    '/signup', 
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({min: 6})
    ],
    authUserController.signup
);


// @route   POST auth/login
router.post(
    '/login',
    [
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({min: 6})
    ],
    authUserController.login
);


// router.use(checkAuth); // Middleware to check if the user is authenticated

router.post(
    '/add-friend',
    [
        check('friendEmail').normalizeEmail().isEmail()
    ],
    authUserController.addfriend

);
router.post(
    '/add-to-wishlist',
    [
        check('productName').not().isEmpty(),
        check('productPrice').not().isEmpty()
    ],
    authUserController.addToWishlist
);
router.get(
    '/get-notifications',
    authUserController.getNotifications
);


// Exporting
module.exports = router;