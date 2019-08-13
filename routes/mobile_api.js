var express = require('express');
var router = express.Router();
const crypto = require('crypto');
var SMSGH = require('smsghjs');
var sms = new SMSGH({
    clientId: "lsvmowhl",
    clientSecret: "jmxuzjzl"
});
const path = require("path");
const multer = require("multer");

var users = require('../models/users');

const msg1="You can't access to database";
const msg2="Your user info is incorrect";
let inviteInfoArray=[];
let inviteInfo={};

const storage = multer.diskStorage({
    destination: "./public/upload/",
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: {fileSize: 52428800},
}).single("file");

router.get("/",function (req, res) {
    send_json_data(res,"success");
});
router.post('/upload', function (req, res) {
        upload(req, res, (err) => {
            if (err) {
                fail_message(res,msg1);
            } else {
                if (req.file) {
                    const filename = req.file.filename;
                    var serverUrl = req.protocol + '://' + req.get('host');
                    var tag = "<a href='" + serverUrl +
                        "/upload/" + filename + "' target='_blank' style='position: relative;'>" +
                        "<img src='./images/file_download.png' >" +
                        filename + "</a>";
                    send_json_data(res,tag);
                } else {
                    fail_message(res,"File Upload Failure!");
                }
            }
        });
    }
);

router.post("/login", function (req, res) {
    users.login(req.body, function (err, count) {
        if (err) {
            console.log(err);
            fail_message(res,msg1);
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
                                fail_message(res,msg1);
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
                                            fail_message(res,"Failure sending sms for OTP code")
                                        } else {                            // do something with the response
                                            send_json_data(res,count[0]);
                                        }
                                    }
                                );
                            }
                        })
                    } else {
                        console.log("no data111111111");
                        fail_message(res,msg2)
                    }
                } else {
                    console.log("no data2222222222222");
                    fail_message(res,msg2)
                }
            } else {
                console.log("no data333333333333333333");
                fail_message(res,msg2)
            }
        }
    });
});
router.post('/confirm', function (req, res) {
    users.getOTP(req.body.userid,function (err, result) {
        if(err){
            console.log(err);
            fail_message(res,msg1)
        }else{
            if (result[0].otp=== req.body.otp) {
                send_json_data(res,result[0])
            } else {
                console.log("\"Verify Failure!\"^^^^^^^^^^^^^^^^^^^^^^^");
                fail_message(res,"Verify Failure!")
            }
        }
    })
});
router.get("/getUsername/:userid",function (req, res) {
    users.getUsername(req.params.userid,function (err, result) {
        if(err){
            console.log("MODEL ERROR^^^^^^^^^^^^^^^^^^^^^^^"+err);
            fail_message(res,msg1)
        }else{
            send_json_data(res,result);
        }
    })
});
router.get("/getFriendList/:myid",function (req, res) {
    users.getFriendList(req.params.myid,function (err, fetch) {
        if(err) {
            console.log("MODEL ERROR^^^^^^^^^^^^^^^^^^^^^^^"+err);
            fail_message(res,msg1);
        }else{
            if(fetch.length>0){
                users.getGroupList(req.params.myid,function (err, groupFetch) {
                    if(err){
                        console.log("MODEL ERROR^^^^^^^^^^^^^^^^^^^^^^^"+err);
                        fail_message(res,msg1);
                    }else{
                        if(groupFetch.length>0){
                            var ggg=0;
                            do{
                                for(var ii=ggg+1;ii<groupFetch.length;ii++){
                                    if(typeof groupFetch[ggg]!="undefined" && typeof groupFetch[ii]!="undefined"){
                                        if(groupFetch[ii].groupid===groupFetch[ggg].groupid){
                                            delete groupFetch[ii];
                                        }
                                    }
                                }
                                ggg++;
                            }while (ggg<groupFetch.length-1);
                            var groupFetch1=[];
                            for(var iii=0;iii<groupFetch.length;iii++){
                                if(typeof groupFetch[iii]!="undefined"){
                                    groupFetch1.push(groupFetch[iii]);
                                }
                            }
                            groupFetch=groupFetch1;
                            var result=[];
                            var i=0;
                            do{
                                for(var k=0;k<=i;k++){
                                    result.push(fetch[k]);
                                }
                                for(var j=i+1;j<fetch.length;j++){
                                    if(fetch[i].sender===fetch[j].sender && fetch[i].receiver===fetch[j].receiver){
                                    }else if(fetch[i].sender===fetch[j].receiver && fetch[i].receiver===fetch[j].sender){
                                    }else {
                                        result.push(fetch[j]);
                                    }
                                }
                                fetch=result;
                                result=[];
                                i++;
                            }while (i<fetch.length-1);

                            var kk=0;
                            var fetch1=fetch;
                            for(var jj=0;jj<groupFetch.length;jj++){
                                for(var ii=0;ii<fetch.length;ii++){
                                    if(Date.parse(groupFetch[jj].send_time)>Date.parse(fetch[ii].send_time)){
                                        fetch1.splice(ii+kk,0,groupFetch[jj]);
                                        kk++;
                                        break;
                                    }else {
                                        if(ii===fetch.length-1){
                                            fetch1.push(groupFetch[jj]);
                                            break;
                                        }
                                    }
                                }
                            }
                            send_json_data(res,fetch1);
                        }else{
                            var result=[];
                            var i=0;
                            do{
                                for(var k=0;k<=i;k++){
                                    result.push(fetch[k]);
                                }
                                for(var j=i+1;j<fetch.length;j++){
                                    if(fetch[i].sender===fetch[j].sender && fetch[i].receiver===fetch[j].receiver){
                                    }else if(fetch[i].sender===fetch[j].receiver && fetch[i].receiver===fetch[j].sender){
                                    }else {
                                        result.push(fetch[j]);
                                    }
                                }
                                fetch=result;
                                result=[];
                                i++;
                            }while (i<fetch.length-1);
                            send_json_data(res,fetch);
                        }
                    }
                });
            }else{
                users.getGroupList(req.params.myid,function (err, groupFetch) {
                    if(err){
                        console.log("MODEL ERROR^^^^^^^^^^^^^^^^^^^^^^^"+err);
                        fail_message(res,msg1)
                    }else{
                        var ggg=0;
                        do{
                            for(var ii=ggg+1;ii<groupFetch.length;ii++){
                                if(typeof groupFetch[ggg]!="undefined" && typeof groupFetch[ii]!="undefined"){
                                    if(groupFetch[ii].groupid===groupFetch[ggg].groupid){
                                        delete groupFetch[ii];
                                    }
                                }
                            }
                            ggg++;
                        }while (ggg<groupFetch.length-1);
                        var groupFetch1=[];
                        for(var iii=0;iii<groupFetch.length;iii++){
                            if(typeof groupFetch[iii]!="undefined"){
                                groupFetch1.push(groupFetch[iii]);
                            }
                        }
                        send_json_data(res,groupFetch1);
                    }
                });
            }
        }
    })
});
router.get("/getMessages/:myid/:friendid",function (req, res) {
    users.getMessages(req.params.myid,req.params.friendid,function (err, count) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,count)
        }
    });
    users.getUnreadToRead(req.params.myid,req.params.friendid,function (err, result) {
        if(err){
            console.log(err);
            fail_message(res,msg1);
        }
    });
});
router.get("/getGroupMessages/:myid/:groupid",function (req, res) {
    users.getGroupMessages(req.params.groupid,function (err, count) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            users.getUsernamesGroupRoom(req.params.groupid,function (err1, result1) {
                if(err1) {
                    console.log(err1);
                    fail_message(res,msg1);
                }else{
                    send_json_data(res, {
                        messages:count,
                        members:result1
                    });
                }
            });
        }
    });
    users.getUnreadToReadInGroup(req.params.myid,req.params.groupid,function (err, result) {
        if(err){
            console.log(err);
            fail_message(res,msg1);
        }
    });
});
router.get('/getUsersGroupRoom/:groupid',function (req, res) {
    users.getUsersGroupRoom(req.params.groupid,function (err, result) {
        if(err){
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,result);
        }
    })
});
router.get('/getNewUsers/:userid',function (req, res) {
    users.getNewUsers(req.params.userid,function (err, result) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,result);
        }
    });
});
router.get('/getAllUsers/:id',function (req, res) {
    users.getAllUsers(req.params.id,function (err, result) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,result);
        }
    });
});
router.get('/addNewChat/:myid/:newid',function (req, res) {
    users.addNewChat(req.params.myid,req.params.newid,function (err, result) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            users.getUsername(req.params.newid,function (err1, result1) {
                if(err1) {
                    console.log(err1);
                    fail_message(res,msg1);
                }else{
                    var newMsg="Hello, "+result1[0].username+".\n" +
                        "I added you to my contact list.\n" +
                        "Please chat with me.";
                    users.recordMessaging(req.params.myid,req.params.newid,newMsg,function (err2, result2) {
                        if(err2) {
                            console.log(err2);
                            fail_message(res,msg1);
                        }else{
                            send_json_data(res,newMsg);
                        }
                    });
                }
            });
        }
    });
});
router.post('/createNewGroup/',function (req, res) {
    var newGroupName;
    users.getGroupName(function (err, result) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            newGroupName="group "+(result[0].numGroup+1);
            users.createNewGroup(newGroupName,req.body.id,function (err1, result1) {
                if(err1) {
                    console.log(err1);
                    fail_message(res,msg1);
                }else{
                    users.getGroupId(newGroupName,function (err2, result2) {
                        if(err2) {
                            console.log(err2);
                            fail_message(res,msg1);
                        }else{
                            var data1=JSON.parse(req.body.data);
                            users.addMemberToGroup(result2[0].groupid,req.body.id,function (err3, result3) {
                                if(err3) {
                                    console.log(err3);
                                    fail_message(res,msg1);
                                }
                            });
                            for(var i=0;i<data1.length;i++){
                                users.addMemberToGroup(result2[0].groupid,data1[i],function (err3, result3) {
                                    if(err3) {
                                        console.log(err3);
                                        fail_message(res,msg1);
                                    }
                                });
                            }
                            var newMsg="Hello. I have created this new group.";
                            users.recordMessageToGroup(result2[0].groupid,req.body.id,newMsg,function (err4, result4) {
                                if(err4) {
                                    console.log(err4);
                                    fail_message(res,msg1);
                                }else{
                                    send_json_data(res,{
                                        groupid: result2[0].groupid,
                                        newMsg: newMsg,
                                        name:newGroupName
                                    })
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});
router.post("/updatePassword/",function (req, res) {
    users.exactableOldPass(req.body.userid,function (err1, result1) {
        if(err1){
            console.log(err1);
            fail_message(res,msg1);
        }else{
            if(result1[0].password!==crypto.createHash('sha256').update(req.body.old_pass).digest('base64')){
                fail_message(res,"failure matching password")
            }else{
                users.updatePassword(req.body.userid,req.body.new_pass,function (err, result) {
                    if(err){
                        console.log(err);
                        fail_message(res,msg1);
                    }else{
                        send_json_data(res,result);
                    }
                });
            }
        }
    });
});
router.post("/submit/",function (req, res) {
    users.getUsername(req.body.userid,function (err, result) {
        if(err){
            console.log(err);
            fail_message(res,msg1);
        }else{
            users.getAdminPhone(1,function (err1, result1) {
                if(err1){
                    console.log(err1);
                    fail_message(res,msg1);
                }else{
                    var sms = new SMSGH({
                        clientId: "lsvmowhl",
                        clientSecret: "jmxuzjzl"
                    });
                    sms.setContextPath('v3');
                    // Send a quick message
                    sms.messaging.sendQuickMessage(
                        result[0].username,
                        result1[0].phonenum,
                        req.body.content,
                        function (err2, smsres) {
                            if (err2) {  // handle the Error
                                console.log("^^^^^^^^^^^response error===>" + err + ">>>>res>>>" + smsres);
                                fail_message(res,"Failure sending sms for OTP code");
                            } else {
                                send_json_data(res,smsres);
                            }
                        }
                    );
                }
            });
        }
    })
});
router.get('/getNewMembers/:groupid',function (req, res) {
    users.getNewMemberOfGroup(req.params.groupid,function (err, result) {
        if(err){
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,result);
        }
    });
});
router.get('/leftGroup/:groupid/:myid/', function (req, res) {
    users.removeUserFromGroupRoom(req.params.groupid, req.params.myid, function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        }
    });
    users.removeHistoryFromGroupChat(req.params.groupid, req.params.myid, function (err1) {
        if (err1) {
            console.log(err1);
            res.json(err1);
        }
    });
    users.getAttachedFile(req.params.myid, req.params.groupid, true, function (err, result) {
        if (err) {
            console.log(err);
            res.json(err);
        } else {
            if (result.length > 0) {
                result.map(row => {
                    fs.unlink("public" + row.url.substring(row.url.indexOf("/upload")),error=>{
                        console.log(error);
                    });
                });
                users.removeAttachedFile(req.params.myid, req.params.groupid, true, function (err) {
                    if (err) {
                        console.log(err);
                        res.json(err);
                    }
                })
            }
        }
    });
    users.getUsersGroupRoom(req.params.groupid, function (err2, result2) {
        if (err2) {
            console.log(err2);
            res.json(err2);
        } else {
            if (result2.length <= 1) {
                users.removeGroup(req.params.groupid, function (err5) {
                    if (err5) {
                        console.log(err5);
                        res.json(err5);
                    }
                });
                users.removeUserFromGroupRoom(req.params.groupid, result2[0].userid, function (err3) {
                    if (err3) {
                        console.log(err3);
                        res.json(err3);
                    }
                });
                users.removeHistoryFromGroupChat(req.params.groupid, result2[0].userid, function (err4) {
                    if (err4) {
                        console.log(err4);
                        res.json(err4);
                    } else {
                        res.json({status: "success"});
                    }
                });
                users.getAttachedFileFromGroup(req.params.groupid,true,function (err,result) {
                    if(err)console.log(err);
                    else{
                        if(result.length>0){
                            result.map(row => {
                                fs.unlink("public" + row.url.substring(row.url.indexOf("/upload")),error=>{
                                    console.log(error);
                                });
                            });
                            users.removeAttachedFileFromGroup(req.params.groupid, true, function (err) {
                                if (err) {
                                    console.log(err);
                                    res.json(err);
                                }else{
                                    res.json({status: "success"});
                                }
                            })
                        }
                    }
                })
            } else {
                res.json({status: "success"});
            }
        }
    });
});
router.get('/removeMember/:yourid/:myid', function (req, res) {
    users.removeRoomFromSingleRoom(req.params.yourid, req.params.myid, function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        }
    });
    users.deleteChattingHistory(req.params.yourid, req.params.myid, function (err) {
        if (err) {
            console.log(err);
            res.json(err);
        } else {
            users.getAttachedFile(req.params.myid, req.params.yourid, false, function (err, result) {
                if (err) {
                    console.log(err);
                    res.json(err);
                } else {
                    if (result.length > 0) {
                        for (let i=0;i<result.length;i++){
                            fs.unlink("public"+result[i].url.substring(result[i].url.indexOf("/upload")),error=>{
                                if(error){
                                    console.log(error)
                                }
                            });
                        }

                        users.removeAttachedFile(req.params.myid, req.params.yourid, false, function (err) {
                            if (err) {
                                console.log(err);
                                res.json(err);
                            }else{
                                res.json("success");
                            }
                        })
                    }else {
                        res.json("success");
                    }
                }
            });
        }
    });
});
router.post('/addMembersToGroup/',function (req, res) {
    var data1=JSON.parse(req.body.data);
    for(var i=0;i<data1.length;i++){
        users.addMemberToGroup(req.body.groupid,data1[i],function (err, result) {
            if(err) {
                console.log(err);
                fail_message(res,msg1);
            }else{
                users.getUsernamesGroupRoom(req.body.groupid,function (err1, result1) {
                    if(err1) {
                        console.log(err1);
                        fail_message(res,msg1);
                    }else{
                        send_json_data(res,result1);
                    }
                })
            }
        });
    }
});
router.get('/getGroupsForMeNotYou/:myid/:yourid/',function (req, res) {
    users.getGroupsForMeNotYou(req.params.myid,req.params.yourid,function (err, result) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,result);
        }
    })
});
router.get('/addCurrentMember/:yourid/:groupid',function (req, res) {
    users.addCurrentMember(req.params.yourid,req.params.groupid,function (err, result) {
        if(err) {
            console.log(err);
            fail_message(res,msg1);
        }else{
            send_json_data(res,result);
        }
    })
});
router.post('/getInviteUrl',function (req,res) {
    inviteInfo.channel=req.body.channel;
    inviteInfo.randomID=generateRandomID(20);
    inviteInfoArray.push(inviteInfo);
    send_json_data(res,inviteInfo.randomID);
});

function send_json_data(res,data){
    res.json({
        success:true,
        data:data
    });
}
function fail_message(res,message){
    res.json({
        success: false,
        message: message,
    });
}
function generateRandomID(val) {
    var newRandomID='';
    var str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0;i<val;i++){
        newRandomID+=str.charAt(Math.floor(Math.random()*62));
    }
    return newRandomID;
}
function getOTP() {
    const normalUpperString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const normalNumber = "0123456789";

    var result_str = "";
    var result_num = "";

    for (var i = 0; i < 4; i++) {
        result_str += normalUpperString.charAt(Math.floor(Math.random() * 26));
        result_num += normalNumber.charAt(Math.floor(Math.random() * 10));
    }
    return result_str + "-" + result_num;
}

module.exports = router;

