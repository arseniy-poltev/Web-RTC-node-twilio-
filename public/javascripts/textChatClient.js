/**
 * Created by User on 6/25/2018.
 */
var fid, gid, singleid;
let isGroup = false;
var onGroupChatting = false;
const admin_servername = "https://admin.trogj.app/userImages/";

$(document).ready(function () {
    /**
     * online/offline
     */
    socket.emit('check_online', id);
    // socket.emit('get service');
    socket.on('add_online_member', function (oid) {
        if (oid != id) {
            for (var i = 0; i < contactList.length; i++) {
                if (!contactList[i].groupid) {
                    if (contactList[i].sender == oid || contactList[i].receiver == oid) {
                        setTimeout(function () {
                            $(".info").find("ul").children("li").eq(i).find(".profile").find("img.profilePhoto").attr("src", "../images/trogj_02db_icn_user_online.png");
                        }, 1000);
                        break;
                    }
                }
            }
        }
    });
    socket.on('remove_online_member', function (oid) {
        if (oid != id) {
            for (var i = 0; i < contactList.length; i++) {
                if (!contactList[i].groupid) {
                    if (contactList[i].sender == oid || contactList[i].receiver == oid) {
                        $(".info").find("ul").children("li").eq(i).find(".profile").find("img.profilePhoto").attr("src", "../images/trogj_02db_icn_offline.png");
                        break;
                    }
                }
            }
        }
    });
    socket.on('online_members', function (onlines) {
        for (var i = 0; i < contactList.length; i++) {
            if (!contactList[i].groupid) {
                for (var j = 0; j < onlines.length; j++) {
                    if (onlines[j] != id) {
                        if (contactList[i].sender == onlines[j] || contactList[i].receiver == onlines[j]) {
                            $(".info").find("ul").children("li").eq(i).find(".profile").find("img.profilePhoto").attr("src", "../images/trogj_02db_icn_user_online.png");
                        }
                    }
                }
            }
        }
    });

    /**
     * file upload
     */
    var delivery = new Delivery(socket);
    // var delivery = dl.listen(socket);
    delivery.on('delivery.connect', function (delivery) {
        $("#file_choose").change(function (evt) {
            var file = $("#file_choose")[0].files[0];
            var fileName = file.name;
            delivery.send(file);
            evt.preventDefault();
        });
    });

    delivery.on('send.success', function (fileUID) {
        $("input[name='new_chat']").val(
            "<a href='" + window.location.protocol + "//" +
            window.location.hostname + ":" + window.location.port +
            "/upload/" + fileUID.name + "' target='_blank' style='position: relative;'>" +
            "<img src='./images/file_download.png' >" +
            fileUID.name + "</a>");
        $("#send").click();
    });
    /**
     * text chatting
     */
    var chatting = $("input[name='new_chat']");
    // chatting.spellAsYouType();
    socket.on('receive', function (data) {
        messageReceive();
        if (data.groupid) {
            onGroupChatting = true;
            updateInfoPart(data.groupid, data.msg);
        } else {
            onGroupChatting = false;
            updateInfoPart(data.user, data.msg);
        }
        createChatMessage(data.msg, data.user);
        scrollToBottom();
    });
    socket.on('first message', function (data) {
        if (data.user != id) {
            if (data.groupid) {
                onGroupChatting = true;
                $.get('/api/getUsersGroupRoom/' + data.groupid,
                    function (data1, status) {
                        if (status === "success") {
                            if (data1.length > 0) {
                                for (var i = 0; i < data1.length; i++) {
                                    if (data1[i].userid == id) {
                                        updateInfoPartFirst(data.groupid, data.msg);
                                        break;
                                    }
                                }
                            }
                        } else {
                            alert("err<>>>" + status);
                        }
                    });
            } else {
                onGroupChatting = false;
                if (data.friendid == id) {
                    updateInfoPartFirst(data.user, data.msg);
                }
            }
        }
    });
    socket.on('added new', function (data) {
        if (id != data.user) {
            var date = new Date();
            var last_time = convertTime(date);
            if (data.groupid) {
                $.get('/api/getUsersGroupRoom/' + data.groupid,
                    function (data1, status) {
                        if (status === "success") {
                            if (data1.length > 0) {
                                for (var i = 0; i < data1.length; i++) {
                                    if (data1[i].userid == id) {
                                        messageReceive();
                                        $(".chatBg").find("input[name='new_chat']").removeAttr("disabled");
                                        var list = '<div class="divider"></div>' +
                                            '<li onclick="clickListGroup($(this))">' +
                                            '<div class="profile">' +
                                            '<img src="../images/trogj_02db_icn_group_online.png"  class="profilePhoto">' +
                                            '<img class="badge visibleBadge"   src="../images/trogj_02db_badge_small.png">' +
                                            '</div>' +
                                            '<div class="detail">' +
                                            '<input type="hidden" name="group" value="' + data.groupid + '">' +
                                            '<div class="userid">' + data.name + '</div>' +
                                            '<div class="simple_his"><img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + data.msg + '</div>' +
                                            '</div>' +
                                            '<div class="last_time">' + last_time + '</div>' +
                                            '</li>';
                                        $(".info").find("ul").prepend(list);
                                        window.location.reload();
                                        break;
                                    }
                                }
                            }
                        }
                    });

            } else {
                if (data.friendid == id) {
                    $(".chatBg").find("input[name='new_chat']").removeAttr("disabled");
                    var list = '<div class="divider"></div>' +
                        '<li onclick="clickList($(this))">' +
                        '<div class="profile">' +
                        '<img class="profilePhoto" src="../images/trogj_02db_icn_user_online.png">' +
                        '<img class="badge visibleBadge"  src="../images/trogj_02db_badge_small.png">' +
                        '</div>' +
                        '<div class="detail">' +
                        '<input type="hidden" name="friend" value="' + data.user + '">' +
                        '<div class="userid">' + data.name + '</div>' +
                        '<div class="simple_his"><img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + data.msg + '</div>' +
                        '</div>' +
                        '<div class="last_time">' + last_time + '</div>' +
                        '<input type="hidden" name="send_time" value="' +
                        date.toDateString() + ' at ' + date.getHours() + ":" + date.getMinutes() + '">' +
                        '</li>';
                    $(".info").find("ul").prepend(list);
                    window.location.reload();
                    socket.emit('check_online', id);
                }
            }
        }
    });
    socket.on('leftRoom', function (data) {
        if (data.myid != id) {
            if (data.group) {
                $.get('/api/getUsersGroupRoom/' + data.groupid,
                    function (data1, status) {
                        if (status === "success") {
                            if (data1.length > 0) {
                                for (var i = 0; i < data1.length; i++) {
                                    if (data1[i].userid == id) {
                                        window.location.reload();
                                    }
                                }
                            }
                        }
                    });
            } else {
                if (data.yourid == id) {
                    window.location.reload();
                }
            }
        }
    });

    $("form[name='text_chatting']").submit(function (e) {
        e.preventDefault();
        if (chatting.val().trim().length) {
            createChatMessage(chatting.val(), id);
            scrollToBottom();

            // Send the message to the other person in the chat
            if (onGroupChatting) {
                updateInfoPart(gid, chatting.val());
                socket.emit('groupmsg', {
                    msg: chatting.val(),
                    user: id,
                    groupid: gid
                });
            } else {
                updateInfoPart(fid, chatting.val());
                socket.emit('msg', {
                    msg: chatting.val(),
                    user: id,
                    friendid: fid
                });
            }
            chatting.val('');
        }
        return false;
    });
    $("#send").click(function () {
        $("form[name='text_chatting']").submit();
    });
});

function clickList(element) {
    onGroupChatting = false;
    $(document).ready(function () {
        isGroup = false;
        gid = 0;
        element.siblings("li").removeClass("activeList");
        element.addClass("activeList");
        fid = element.find(".detail").find("input[name='friend']").val();
        singleid = element.find(".detail").find("input[name='single']").val();
        if (!singleid || typeof singleid === "undefined") {
            singleid = Math.round(Math.random() * 5);
        }
        $.get('/api/getUnreadToRead/' + id + "/" + fid,
            function (data, status) {
                if (status === "success") {
                    element.find(".profile").find("img.badge").removeClass("visibleBadge");
                } else {
                    alert("err>>>" + status);
                }
            });
        //chatting history from db to middle part.
        $.get("/api/getMessages/" + id + "/" + fid,
            function (data, status) {
                if (status === "success") {
                    $(".chatBg").find(".chat_content").html("");

                    for (var i = 0; i < data.length; i++) {
                        var time;
                        var messageState = '';
                        if (data[i].sender == id) {
                            messageState = 'sent';
                        } else {
                            messageState = 'received';
                        }
                        time = new Date(data[i].send_time);
                        $(".chatBg").find(".chat_content").append(
                            '<div class="' + messageState + '" >' +
                            '<a class="user">' + data[i].username + '</a><br>' +
                            data[i].content +
                            '<a>' + time.getHours() + ':' + time.getMinutes() + '</a>' +
                            '</div>'
                        );
                    }
                    let profile = '<img class="img-responsive" src="./images/trogj_04info_profile_user.png">';
                    if (element.find("input[name='image']").val() != "" &&
                        element.find("input[name='image']").val() != null &&
                        element.find("input[name='image']").val() != "null" &&
                        typeof element.find("input[name='image']").val() != "undefined" &&
                        element.find("input[name='image']").val() != "undefined") {
                        profile = '<img class="img-responsive"' +
                            ' style="-webkit-border-radius: 50%;-moz-border-radius: 50%;border-radius: 50%;" ' +
                            'src="' + admin_servername + element.find("input[name='image']").val() + '">';
                    }
                    $(".infoBg").find(".contact_profile").html(
                        '<input type="hidden" value="' + fid + '">' + profile +
                        '<div class="chat_type">Contact</div>' +
                        '<div class="userid">' + element.find(".detail").find(".userid").text() + '</div>' +
                        '<div id="new_voicecall" onclick="new_voicecall()"></div>' +
                        '<div id="new_videocall" onclick="new_videocall()"></div>' +
                        '<div class="detail_title">Last Seen</div>' +
                        '<div class="detail_content">' + element.find("input[name='send_time']").val() + '</div>' +
                        '<div id="addToGroup" onclick="DisplayGroups(' + fid + ')"></div>' +
                        '<div id="removeFromContactList" onclick="RemoveMember(' + fid + ')"></div>'
                    );
                }
            });
        scrollToBottom();
        socket.emit('requestJoin', {
            myid: id,
            friendid: fid
        });
    });

}

function clickListGroup(element) {
    onGroupChatting = true;
    fid = 0;
    $(document).ready(function () {
        element.siblings("li").removeClass("activeList");
        element.addClass("activeList");
        gid = element.find(".detail").find("input").val();

        $.get('/api/getUnreadToReadInGroup/' + id + "/" + gid,
            function (data, status) {
                if (status === "success") {
                    element.find(".profile").find("img.badge").removeClass("visibleBadge");
                } else {
                    alert("err>>>" + status);
                }
            });

        channel = gid + 'G';
        isGroup = true;
        //chatting history from db to middle part.
        $.get("/api/getGroupMessages/" + gid,
            function (data, status) {

                if (status === "success") {
                    $(".chatBg").find(".chat_content").html("");
                    var messages = data.messages;
                    var usernames = data.usernames;
                    var displayedUsers = "";
                    for (var i = 0; i < usernames.length; i++) {
                        displayedUsers += usernames[i].username + ", ";
                    }
                    for (var i = 0; i < messages.length; i++) {
                        var time;
                        var messageState = '';
                        if (messages[i].userid == id) {
                            messageState = 'sent';
                        } else {
                            messageState = 'received';
                        }
                        time = new Date(messages[i].send_time);
                        $(".chatBg").find(".chat_content").append(
                            '<div class="' + messageState + '" ><a class="user">' + messages[i].username + '</a><br>' + messages[i].content +
                            '<a>' + time.getHours() + ':' + time.getMinutes() + '</a>' +
                            '</div>'
                        );
                    }
                    $(".infoBg").find(".contact_profile").html(
                        '<input type="hidden" value="' + gid + '">' +
                        '<img class="img-responsive" src="./images/trogj_04info_profile_user.png">' +
                        '<div class="chat_type">Contact</div>' +
                        '<div class="userid">' + element.find(".detail").find(".userid").text() + '</div>' +
                        '<div id="new_voicecall" onclick="new_voicecall()"></div>' +
                        '<div id="new_videocall" onclick="new_videocall()"></div>' +
                        '<div class="detail_title">Members(' + usernames.length + ')</div>' +
                        '<div class="detail_content">' + displayedUsers + '</div>' +
                        '<div id="addMember" onclick="DisplayNonMembers($(this),' + gid + ')"></div>' +
                        '<div id="leftGroup" onclick="DisplayWarning(' + gid + ')"></div>'
                    );
                }
            });
        scrollToBottom();
        socket.emit('requestGroupJoin', {
            myid: id,
            groupid: gid
        });
    });
}

// Functions that creates a new chat message

function createChatMessage(msg, senderid) {

    $(document).ready(function () {
        var time = new Date();
        var messageState = '';
        if (senderid == id) {
            messageState = 'sent';
        } else {
            messageState = 'received';
        }
        $(document).ready(function () {
            $.get("/api/getUsername/" + senderid,
                function (data, status) {
                    if (status == "success") {
                        var li = $(
                            '<div class="' + messageState + '" ><a class="user">' + data[0].username + '</a><br>' + msg +
                            '<a>' + time.getHours() + ':' + time.getMinutes() + '</a>' +
                            '</div>');
                        $(".chatBg").find(".chat_content").append(li);
                    } else {
                        return null;
                    }
                });
        });
    });
}

function updateInfoPart(displayid, msg) {
    for (var i = 0; i < contactList.length; i++) {
        if (!onGroupChatting) {
            if (contactList[i].sender == displayid || contactList[i].receiver == displayid) {
                $(".info").find("ul").children("li").eq(i).find(".detail").find("div.simple_his").html('<img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + msg);
                $(".info").find("ul").children("li").eq(i).find(".last_time").text(convertTime(new Date()));
                $(".info").find("ul").children("li").eq(i).find(".profile").find("img.badge").css("display", "none");
                break;
            }
        } else {
            if (contactList[i].groupid == displayid) {
                $(".info").find("ul").children("li").eq(i).find(".detail").find("div.simple_his").html('<img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + msg);
                $(".info").find("ul").children("li").eq(i).find(".profile").find("img.badge").css("display", "none");
                break;
            }
        }
    }
}

function updateInfoPartFirst(displayid, msg) {
    messageReceive();
    for (var i = 0; i < contactList.length; i++) {
        if (!onGroupChatting) {
            if (contactList[i].sender == displayid || contactList[i].receiver == displayid) {
                $(".info").find("ul").children("li").eq(i).find(".detail").find("p").html('<img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + msg);
                $(".info").find("ul").children("li").eq(i).find(".last_time").text(convertTime(new Date()));
                $(".info").find("ul").children("li").eq(i).find(".profile").find("img.badge").addClass("visibleBadge");
                break;
            }
        } else {
            if (contactList[i].groupid == displayid) {
                $(".info").find("ul").children("li").eq(i).find(".detail").find("p").html('<img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + msg);
                $(".info").find("ul").children("li").eq(i).find(".last_time").text(convertTime(new Date()));
                $(".info").find("ul").children("li").eq(i).find(".profile").find("img.badge").addClass("visibleBadge");

                break;
            }
        }
    }
    for (var i = 0; i < contactList.length; i++) {
        if ($(".info").find("ul").children("li").eq(i).attr("class") == "activeList") {
            $(".info").find("ul").children("li").eq(i).click();
        }
    }
}

function new_friend(myid, friendid, newMsg) {
    $.get('/api/getUsername/' + myid, function (data, status) {
        if (status === "success") {
            socket.emit('added new', {
                msg: newMsg,
                user: myid,
                friendid: friendid,
                name: data[0].username
            });
            socket.emit('check_online', id);
        } else {
            alert(">>>error>>" + status);
        }
    });

}

function new_Group(myid, groupid, newMsg, groupname) {
    socket.emit('added new', {
        msg: newMsg,
        user: myid,
        groupid: groupid,
        name: groupname
    });
    socket.emit('check_online', id);
}

function scrollToBottom() {
    $(".chat_content").animate({scrollTop: $(this).height() * 100 ^ 100}, 'slow');
}