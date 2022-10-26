// config/passport.js

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; // 1
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var User = require('../models/User');

// serialize & deserialize User // 2
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findOne({ _id: id }, function (err, user) {
        done(err, user);
    });
});

// local strategy // 3
passport.use('local-login',
    new LocalStrategy({
        usernameField: 'username', // 3-1
        passwordField: 'password', // 3-1
        passReqToCallback: true
    },
        function (req, username, password, done) { // 3-2
            User.findOne({ username: username })
                .select({ password: 1 })
                .exec(function (err, user) {
                    if (err) return done(err);

                    if (user && user.authenticate(password)) { // 3-3
                        return done(null, user);
                    }
                    else {
                        req.flash('username', username);
                        req.flash('errors', { login: 'username 또는 password가 일치하지 않습니다' });
                        return done(null, false);
                    }
                });
        }
    )
);

var googleCredentials = require('../config/google.json');
const { application } = require('express');
passport.use(new GoogleStrategy(
    {
        clientID : googleCredentials.web.client_id,
        clientSecret : googleCredentials.web.client_secret,
        callbackURL : googleCredentials.web.redirect_uris[0],
        passReqToCallBack : true
    }, 
    function(request, accessToken, refreshToken, profile, done) {
        User.findOneAndUpdate({
            googleId: profile.displayName
        }, {upsert: true}, function (err, user) {
            if (user) {
                return done (null, user);
            }
            else {
                var newUser = {
                    username: profile.displayName,
                    password: 'abc12345678',
                    passwordConfirmation: 'abc12345678',
                    googleId: profile.displayName,
                    name: profile.displayName,                 
                };
                User.create(newUser, function (err, user) {
                    console.log('err: ', err);
                    console.log('user: ', user); 
                    return done(null, displayName)
                });
            }
        })
    }
));

module.exports = passport;