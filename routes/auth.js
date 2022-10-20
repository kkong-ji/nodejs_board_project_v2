var express = require('express');
var router = express.Router();
var passport = require('../config/passport.js');

router.get('/login', function(req, res) {
    res.render('auth/google');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


module.exports = router;