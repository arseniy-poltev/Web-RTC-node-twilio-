var express = require('express');
var session = require('express-session');
var router = express.Router();
router.use(session({
    saveUninitialized:true,
    resave:false,
    secret:'MY_SECRET'
}));

var SMSGH = require('smsghjs');
var sms = new SMSGH({
    clientId: "lsvmowhl",
    clientSecret: "jmxuzjzl"
});

sms.setContextPath('v3');

var users=require('../models/users');

var inviteInfoArray=[];
var inviteInfo={};
/* GET home page. */
router.get('/', function(req, res) {
    if (req.session.loggedUser) { // User is logged
        res.redirect('/dashboard');
    } else { // User is not logged
        req.session.destroy();
        res.render('login');
    }
});

router.post('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
});

router.get("/confirm",confirmController);
router.post("/confirm",confirmController);
function confirmController(req, res) {
    // Check if the user is already logged in
    if (isLogged(req.session)) {
        // User is already logged. Immediately return dashboard
        res.redirect('/dashboard');
    } else {
        users.login(req.body, function (err, count) {
            if (err) {
                res.json(err);
                console.log(err);
            } else {
                if (count != null) {
                    if (count[0] != null) {
                        if (count[0].userid > 0) {
                            var phone_num = count[0].phonenum;
                            console.log('\n^^^^^^^^^^phone number===>' + phone_num);
                            // One-Time Password messaging

                            const OTP_code = getOTP();
                            users.insertOTP(count[0].userid, OTP_code, function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('\ngenerating scheduled message^^^^^^^^^^^^^OTP code===>' + OTP_code);

                                    // Send a quick message
                                    sms.messaging.sendQuickMessage(
                                        'ConnectWork',
                                        phone_num,
                                        OTP_code + ' is your one-time security code.',

                                        function (err, smres) {
                                            if (err) {  // handle the Error
                                                console.log("^^^^^^^^^^^response error===>" + err + ">>>>res>>>" + smres);
                                                res.redirect("/")
                                            } else {                            // do something with the response
                                                console.log('send message_response^^^^^^^^^^^^' + smres.length + ">>>id>>>" + count[0].userid);
                                                res.render("confirm",{id:count[0].userid});
                                            }
                                        }
                                    );
                                }
                            })
                        } else {
                            res.redirect("/");
                        }
                    } else {
                        res.redirect("/");
                    }
                } else {
                    res.redirect("/");
                }
            }
        });
    }
}

router.get('/dashboard',function (req, res) {
    if (isLogged(req.session)) {
        // User is already logged. Immediately return dashboard
        res.render('dashboard.ejs', {
            id: req.session.loggedUser.userid
        });
    } else {
        req.session.destroy();
        res.redirect("/");
    }
});
router.post('/dashboard',dashboardController);

function dashboardController(req, res) {
    // Check if the user is already logged in
    if (isLogged(req.session)) {
        // User is already logged. Immediately return dashboard
        res.render('dashboard.ejs', {
            id: req.session.loggedUser.userid
        });
    } else {
        users.getOTP(req.body.userid,function (err, result) {
            if(err){
                console.log(err);
            }else{
                if (result[0].otp=== req.body.otp_value) {
                    req.session.loggedUser = result[0];
                    res.render("dashboard", {
                        id: result[0].userid
                    });
                } else {
                    req.session.destroy();
                    res.redirect("/");
                }
            }
        })
    }
}
router.get('/:channel/:randomID',function (req, res) {
    for (var i=0;i<inviteInfoArray.length;i++){
        if (req.params.randomID===inviteInfoArray[i].randomID){
            res.render('invite.ejs',{
                sendChannel:inviteInfoArray[i].channel
            });
            break;
        }
    }

});
router.post('/getInviteUrl',function (req,res) {
    inviteInfo.channel=req.body.channel;
    inviteInfo.randomID=generateRandomID(20);
    inviteInfoArray.push(inviteInfo);
    res.json(inviteInfo.randomID);
});

function getOTP() {
    const normalUpperString="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const normalNumber="0123456789";

    var result_str="";
    var result_num="";

    for(var i=0;i<4;i++){
        result_str+=normalUpperString.charAt(Math.floor(Math.random()*26));
        result_num+=normalNumber.charAt(Math.floor(Math.random()*10));
    }
    return result_str+"-"+result_num;
}

function isLogged(session) {
    return (session.loggedUser != null);
}
function generateRandomID(val) {
    var newRandomID='';
    var str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0;i<val;i++){
        newRandomID+=str.charAt(Math.floor(Math.random()*62));
    }
    return newRandomID;
}
module.exports = router;
