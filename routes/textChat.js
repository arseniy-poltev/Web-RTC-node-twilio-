var model = require('../models/users');
var online = [];
var dl = require('delivery');
var fs = require('fs');
const TWILIO_ACCOUNT_SID = "AC2a952eb068b34a2e538ca8a12f47e073";
const TWILIO_AUTH_TOKEN = "822bb7f3fc89bc7a76f3417a25727ea5";
const TWILIO_NOTIFICATION_SERVICE_SID = 'IS33550e928b2ca3f937ac687c96e04bfc';

// const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
// const notifyService = client.notify.services(TWILIO_NOTIFICATION_SERVICE_SID);
module.exports = function (io) {
    // Initialize a new socket.io application, named 'chat'
    io.on('connection', function (socket) {
        /**
         * // online/offline state
         */
        socket.on('check_online', function (userid) {
            if (userid.indexOf("not set string value") > -1) {
                console.log("Not defined user id>>>>");
                return;
            }
            socket.userid = userid;
            var same = false;
            if (online.length > 0) {
                for (var i = 0; i < online.length; i++) {
                    if (online[i] === userid) {
                        same = true;
                        break;
                    }
                }
            }
            if (!same) {
                console.log("\nnew joined!!!>>>>>>>>>>>>>>>>");
                online.push(userid);
            }
            setTimeout(function () {
                io.sockets.emit('add_online_member', userid);
            }, 1000);
            setTimeout(function () {
                console.log("online members<<<>>>", online);
                socket.emit('online_members', online);
            }, 2000);
        });
        var delivery = dl.listen(socket);
        delivery.on('receive.success', function (file) {
            fs.writeFile('./public/upload/' + file.name, file.buffer, function (err) {
                if (err) {
                    console.log('File could not be saved.');
                } else {
                    console.log('file>>>>>>>>.', file.name);
                }
            });
        });
        socket.on("leave room", function () {
            socket.leave(socket.room);
            socket.room = null;
            console.log("--------------------> Leave Room >>>>>>>>>>>>");
        });
        socket.on('disconnect', function () {
            console.log("disconnect>>>>>>>>>>>>>>>>>>>>>>>>>>>" + socket.userid);
            for (var i = 0; i < online.length; i++) {
                if (socket.userid === online[i]) {
                    delete online[i];
                    break;
                }
            }
            online = online.filter(function (el) {
                return el != null;
            });
            io.sockets.emit('remove_online_member', socket.userid);
            socket.leave(socket.room);
        });

        /**
         * //.........................Single chatting....................................
         */
        socket.on('requestJoin', function (data) {
            model.getRoomNo(data.myid, data.friendid, function (err, count) {
                if (err) {
                    console.error(err);
                } else {
                    if (count.length > 0) {
                        socket.leave(socket.room);
                        var roomid = count[0].roomid;
                        socket.room = roomid;
                        socket.join(roomid, () => {
                            console.log("\n.......STARTING SINGLE CHATTING.................\n");
                        });
                    }
                }
            })
        });

        // Handle the sending of messages
        socket.on('msg', function (data) {
            model.recordMessaging(data.user, data.friendid, data.msg, function (err, result1) {
                if (err) {
                    console.log("error>>>" + err);
                }
            });
            if (data.msg.indexOf("<a href='") !== -1) {
                const fileUrl = data.msg.substring(data.msg.indexOf("<a href='") + 9, data.msg.indexOf("' target='_blank'"));
                model.isAttachedFile(data.user, data.friendid, false, fileUrl, function (err, result) {
                    if (err) console.log(err);
                    else {
                        if (result.length <= 0) {
                            model.saveAttachedFile(data.user, data.friendid, fileUrl, false, function (err) {
                                if (err) console.log(err);
                            });
                        }
                    }
                })
            }

            // When the server receives a message, it sends it to the other person in the room.
            io.in(socket.room).clients((error, clients) => {
                if (error) console.log("error>>", error);
                model.getUsername(data.user, function (err1, result2) {
                    if (err1) console.log(err1);
                    else {
                        // notifyService.notifications.create({
                        //     title: `TROGJ`,
                        //     priority: 'high',
                        //     identity: [data.friendid],
                        //     body: data.msg.indexOf("<a href='") === -1 ? data.msg : "Sent New File",
                        // }).then(notification => {
                        // }).catch(error => {
                        // }).done();

                        if (clients.length === 2) {
                            socket.broadcast.to(socket.room).emit('receive', {
                                msg: data.msg,
                                user: data.user,
                                username: result2[0].username,
                                friendid: data.friendid
                            });
                        } else {
                            io.sockets.emit('first message', {
                                msg: data.msg,
                                username: result2[0].username,
                                user: data.user,
                                friendid: data.friendid
                            });
                        }
                    }
                });
            })
        });

        //...........................Group chatting.............................
        socket.on('requestGroupCall', function (data) {
            model.getUsersGroupRoom(data.groupid, function (err, count) {
                if (err) {
                    console.error("\ndatabase err>>>" + err);
                } else {
                    socket.emit('members', count);
                }
            })
        });
        socket.on('requestGroupJoin', function (data) {
            model.getUsersGroupRoom(data.groupid, function (err, count) {
                if (err) {
                    console.error("\ndatabase err>>>" + err);
                } else {
                    var roomid = data.groupid + "G";
                    socket.emit('members', count);
                    socket.leave(socket.room);

                    socket.room = roomid;
                    // Add the client to the room
                    socket.join(roomid, () => {
                        console.log("\n.......STARTING GROUP CHATTING.................\n", roomid);
                    });
                }
            })
        });

        socket.on('groupmsg', function (data) {
            model.recordMessageToGroup(data.groupid, data.user, data.msg, function (err) {
                if (err) {
                    console.log("error>>>" + err);
                }
            });
            if (data.msg.indexOf("<a href='") !== -1) {
                const fileUrl = data.msg.substring(data.msg.indexOf("<a href='") + 9, data.msg.indexOf("' target='_blank'"));
                model.isAttachedFile(data.user, data.groupid, true, fileUrl, function (err, result) {
                    if (err) console.log(err);
                    else {
                        if (result.length <= 0) {
                            model.saveAttachedFile(data.user, data.groupid, fileUrl, true, function (err) {
                                if (err) console.log(err);
                            });
                        }
                    }
                })
            }
            // When the server receives a message, it sends it to the other person in the room.
            io.in(socket.room).clients((error, clients) => {
                if (error) console.log("error>>>", error);
                model.getUsername(data.user, function (err1, result2) {
                    if (err1) console.log(err1);
                    else {
                        // model.getUsernamesGroupRoom(data.groupid, function (err, result) {
                        //     if (err) {
                        //         console.log(err);
                        //         return;
                        //     }
                        //     if (result.length <= 0) {
                        //         console.log(`No User In the Group for Group id ${data.groupid}`);
                        //         return;
                        //     }
                        //     let userIds = [];
                        //     for (let user of result) {
                        //         if (socket.userid != user.userid) {
                        //             userIds.push(user.userid.toString());
                        //         }
                        //     }
                        //
                        //     notifyService.notifications.create({
                        //         title: `TROGJ`,
                        //         priority: 'high',
                        //         identity: [userIds],
                        //         body: data.msg.indexOf("<a href='") === -1 ? data.msg : "Sent New File",
                        //     }).then(notification => {
                        //     }).catch(error => {
                        //     }).done();
                        // });
                        if (clients.length > 1) {
                            socket.broadcast.to(socket.room).emit('receive', {
                                msg: data.msg,
                                user: data.user,
                                username: result2[0].username,
                                groupid: data.groupid
                            });
                        } else {
                            io.sockets.emit('first message', {
                                msg: data.msg,
                                username: result2[0].username,
                                user: data.user,
                                groupid: data.groupid
                            });
                        }
                    }
                })
            })
        });
        socket.on('added new', function (data) {
            io.sockets.emit('added new', data);
        });
        socket.on('leftRoom', function (data) {
            io.sockets.emit('leftRoom', data);
        })
    });
};