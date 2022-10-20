var express = require('express');
var router = express.Router();
var passport = require('../config/passport');

// Home
router.get('/', function (req, res) {
    res.render('home/welcome', {user: req.user});
});
router.get('/about', function (req, res) {
    res.render('home/about');
});
router.get('/post', function (req, res) {
    res.render('home/post');
});

// Login
router.get('/login', function (req, res) {
    var username = req.flash('username')[0];
    var errors = req.flash('errors')[0] || {};
    res.render('home/login', {
        username: username,
        errors: errors
    });
});

// Google Login
router.get('/auth/google',
    // 구글 페이지로 가서 로그인
    passport.authenticate('google', {
         scope: ['profile', "email"] 
    })
);

router.get('/auth/google/callback',
    passport.authenticate('google'), authSucess
);

function authSucess(req, res) {
    res.redirect('/post');
}

// Post Login // 3
router.post('/login',
    function (req, res, next) {
        var errors = {};
        var isValid = true;

        if (!req.body.username) {
            isValid = false;
            errors.username = 'Username 은 필수입니다!';
        }
        if (!req.body.password) {
            isValid = false;
            errors.password = 'Password 는 필수입니다!';
        }

        if (isValid) {
            next();
        }
        else {
            req.flash('errors', errors);
            res.redirect('/login');
        }
    },
    passport.authenticate('local-login', {
        successRedirect: '/posts',
        failureRedirect: '/login'
    }
));

// Logout // 4
router.get('/logout', (req, res) => {
    req.logout(req.username, err => {
        if(err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;