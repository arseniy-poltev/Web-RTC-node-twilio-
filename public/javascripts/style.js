/**
 * Created by User on 6/14/2018.
 */
var id;
var visibleInvitePopup = false;
var blockable = false;
let hang_audio = new Audio('../audio/hang.mp3');

var contactList = [];
var socket = io();

$(document).ready(function () {
    id = $("[name='userid']").val();
    //event
    $("#signin").click(function () {
        var userid = $("[name='username']").val();
        var password = $("[name='password']").val();
        if (userid === "") {
            $("[name='username']").focus();
        } else if (password === "") {
            $("[name='password']").focus();
        } else {
            $("[name='login-form']").submit();
        }
    });
    $(".otp_confirm").click(function () {
        if ($("[name='otp_value']").val() === "") {
            $("[name='otp_value']").focus();
        } else {
            $("form[name='otp-form']").submit();
        }
    });
    $(".close").click(function () {
        $(this).parent().submit();
    });
    $(".cancel").click(function () {
        $(this).parent().submit();
    });
    $(".nav").find("ul.calls").children().click(function () {
        $(".nav").find("ul.pointer1").children().css("visibility", "hidden");
        $(".nav").find("ul.pointer2").children().css("visibility", "hidden");
        $(this).siblings().removeClass("activedb");
        $(this).siblings().removeClass("activecontact");
        $(this).siblings().removeClass("activegroup");
        $(".nav").find("ul.set").children().removeClass("activesettings");
        $(".nav").find("ul.set").children().removeClass("activehelp");
        switch ($(this).attr("class")) {
            case "db":
            case "db activedb":
                $(this).addClass("activedb");
                $(".nav").find("ul.pointer1").children().eq(0).css("visibility", "visible");
                if (id !== "undefined") {
                    $.get("/api/getFriendList/" + id,
                        function (data, status) {
                            if (status == "success") {
                                $(".info").find("ul").html("");
                                if (data.length > 0) {
                                    contactList = data;
                                    $(".chatBg").find("input[name='new_chat']").removeAttr("disabled");

                                    for (var i = 0; i < data.length; i++) {
                                        if (data[i].groupid == null) {
                                            //getting id of element user
                                            var friendid;
                                            if (data[i].sender == id) {
                                                friendid = data[i].receiver;
                                                //selection class chat_type image
                                            } else {
                                                friendid = data[i].sender;
                                                //selection class chat_type image
                                            }
                                            var badge = "";
                                            if (data[i].received != 0) {
                                                badge = '';
                                            } else {
                                                if (data[i].sender == id) {
                                                    badge = '';
                                                } else {
                                                    badge = 'visibleBadge';
                                                }
                                            }
                                            //displaying time on list
                                            var last_time = convertTime(data[i].send_time);
                                            var date = new Date(data[i].send_time);

                                            //building list
                                            var list = '<div class="divider"></div>' +
                                                '<li onclick="clickList($(this))">' +
                                                '<input type="hidden" name="image" value="' + data[i].image_url + '">' +
                                                '<div class="profile">' +
                                                '<img class="profilePhoto" src="../images/trogj_02db_icn_offline.png">' +
                                                '<img class="badge ' + badge + '"  src="../images/trogj_02db_badge_small.png">' +
                                                '</div>' +
                                                '<div class="detail">' +
                                                '<input type="hidden" name="friend" value="' + friendid + '">' +
                                                '<input type="hidden" name="single" value="' + data[i].singleid + '">' +
                                                '<div class="userid">' + data[i].username + '</div>' +
                                                '<div class="simple_his"><img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + data[i].content + '</div>' +
                                                '</div>' +
                                                '<div class="last_time">' + last_time + '</div>' +
                                                '<input type="hidden" name="send_time" value="' +
                                                date.toDateString() + ' at ' + date.getHours() + ":" + date.getMinutes() + '">' +
                                                '</li>';

                                            $(".info").find("ul").append(list);

                                        } else {
                                            //getting id of element user
                                            var groupid;
                                            var imgGroup = "";

                                            groupid = data[i].groupid;

                                            if (data[i].userid === id) {
                                                //selection class chat_type image
                                            } else {
                                                //selection class chat_type image
                                            }
                                            var badge = "";
                                            if (data[i].received != 0) {
                                                badge = '';
                                            } else {
                                                badge = 'visibleBadge';
                                            }
                                            var groupname = data[i].groupname;
                                            var gcontent = data[i].content;
                                            //displaying time on list

                                            var last_timeG = convertTime(data[i].send_time);

                                            //building list
                                            var list = '<div class="divider"></div>' +
                                                '<li onclick="clickListGroup($(this))">' +
                                                '<div class="profile">' +
                                                '<img src="../images/trogj_02db_icn_group_online.png"  class="profilePhoto">' +
                                                '<img class="badge ' + badge + '"   src="../images/trogj_02db_badge_small.png">' +
                                                '</div>' +
                                                '<div class="detail">' +
                                                '<input type="hidden" name="group" value="' + groupid + '">' +
                                                '<div class="userid">' + groupname + '</div>' +
                                                '<div class="simple_his"><img class="chat_type" src="../images/trogj_02db_icn_small_msg.png">' + gcontent + '</div>' +
                                                '</div>' +
                                                '<div class="last_time">' + last_timeG + '</div>' +
                                                '</li>';
                                            $(".info").find("ul").append(list);

                                        }
                                    }
                                    $(".info").find("ul").find("li:first").click();
                                    $(".info").find("li").siblings().find(".detail").find("a").addClass("chat_comment");
                                } else {
                                    toastr.success("No history to display.");
                                    $(".chatBg").find("input[name='new_chat']").attr("disabled", "disabled");
                                }
                            }
                        });
                }
                break;
            case "contact":
            case "contact activecontact":
                $(this).addClass("activecontact");
                $(".nav").find("ul.pointer1").children().eq(1).css("visibility", "visible");

                $("#contact_modal").find(".modal-header").find("h4").text(
                    "Add New User to Contact List"
                );
                var content = "";
                $.get("/api/getNewUsers/" + id, function (data, status) {
                    if (status === "success") {
                        if (data.length > 0) {
                            content += '<ul>';
                            for (var i = 0; i < data.length; i++) {
                                content += '<div class="divider"></div>' +
                                    '<li onclick="selectNewUser($(this))">' +
                                    '<img src="../images/trogj_02db_icn_user_online.png">' +
                                    '<input type="hidden" name="userid" value="' + data[i].userid + '">' +
                                    '<span>' + data[i].username + '</span>' +
                                    '</li>';
                            }
                            content += '<ul>';
                            $("#contact_modal").find(".modal-body").html(content);
                            $("#contact_modal").modal({backdrop: "static"});
                        } else {
                            toastr.options.timeOut = 2000;
                            toastr.warning("New User Doesn't Exist.");
                        }
                    } else {
                        alert("err" >>> status);
                    }
                });
                break;
            case "group":
            case "group activegroup":
                $(this).addClass("activegroup");
                $(".nav").find("ul.pointer1").children().eq(2).css("visibility", "visible");

                $("#contact_modal").find(".modal-header").find("h4").text(
                    "Select Users to Create New Group"
                );
                var content = "";
                $.get("/api/getAllUsers/" + id, function (data, status) {
                    if (status === "success") {
                        if (data.length > 0) {
                            content += '<ul>';
                            for (var i = 0; i < data.length; i++) {
                                content += '<div class="divider"></div>' +
                                    '<li onclick="createNewGroup($(this),' + data.length + ')">' +
                                    '<input type="checkbox">' +
                                    '<img src="../images/trogj_02db_icn_user_online.png">' +
                                    '<input type="hidden" name="userid" value="' + data[i].userid + '">' +
                                    '<span>' + data[i].username + '</span>' +
                                    '</li>';
                            }
                            content += '<ul>';
                        }
                        $("#contact_modal").find(".modal-body").html(content);
                        $("#contact_modal").modal({backdrop: "static"});
                    } else {
                        alert("err" >>> status);
                    }
                });
                $("#contact_modal").modal({backdrop: "static"});
                break;
        }
    });
    $(".nav").find("ul.set").find('li').click(function () {
        $(".nav").find("ul.calls").children().removeClass("activedb");
        $(".nav").find("ul.calls").children().removeClass("activecontact");
        $(".nav").find("ul.calls").children().removeClass("activegroup");
        $(this).siblings().removeClass("activesettings");
        $(this).siblings().removeClass("activehelp");
        $(".nav").find("ul.pointer1").children().css("visibility", "hidden");
        $(".nav").find("ul.pointer2").children().css("visibility", "hidden");
        switch ($(this).attr("class")) {
            case "settings":
            case "settings activesettings":
                $(this).addClass("activesettings");
                $(".nav").find("ul.pointer2").children().eq(0).css("visibility", "visible");
                $("#setting_modal").find(".modal-body").find("input").val("");

                $("#setting_modal").modal({backdrop: "static"});
                break;
            case "help":
            case "activehelp":
                $(this).addClass("activehelp");
                $(".nav").find("ul.pointer2").children().eq(1).css("visibility", "visible");

                $("#help_modal").find(".modal-body").find("textarea").val("");
                $("#help_modal").modal({backdrop: "static"});
                break;
            case "help1":
                $(".screen").css("z-index", "100");
                $(".screen").css("display", "block");
                localStorage.setItem("helpPage", "seen");
            case "logout":
                $(".nav").find("ul.pointer2").children().eq(2).css("visibility", "visible");
                $(this).parent('form').submit();
                localStorage.setItem("helpPage", "");
                break;
        }
    });
    $(".help_first_button").click(function () {
        $("#screen1").css("display", "none");
        $(".screen2").css("display", "block");
        localStorage.setItem("helpPage", "seen");
    });
    $(".help_second_button").click(function () {
        $(".screen2").css("display", "none");
        $(".screen3").css("display", "block");
    });
    $(".help_third_button").click(function () {
        $(".screen3").css("display", "none");
        $(".screen2").css("display", "block");
    });
    $(".help_fourth_button").click(function () {
        $(".screen3").css("display", "none");
        $(".screen4").css("display", "block");
        $(".contact_profile").css("display", "none");
    });
    $(".help_fifth_button").click(function () {
        $(".screen4").css("display", "none");
        $(".screen3").css("display", "block");
        $(".contact_profile").css("display", "block");
    });
    $(".help_sixth_button").click(function () {
        $(".screen4").css("display", "none");
        $(".screen5").css("display", "block");
        $(".contact_profile").css("display", "block");
    });
    $(".help_seventh_button").click(function () {
        $(".screen5").css("display", "none");
        $(".screen4").css("display", "block");
        $(".contact_profile").css("display", "none");
    });
    $(".help_eighth_button").click(function () {
        $(".back_first").click();
    });

    $("#file_send").click(function () {
        $("#file_choose").click();
    });

    $("#accept_voice_call").click(function () {
        $(".chatBg").find(".accept_voice_call").css("display", "none");
        $(".chatBg").find(".refuse_voice_call").css("display", "none");
        $(".chatBg").find(".end_voice_call").css("display", "block");
        joinCalling();
    });
    $("#refuse_voice_call").click(function () {
        partChatChannel();
        $(".chatBg").find(".chat_content").css("height", "80%");
        $(".chatBg").find(".writing").css("bottom", "0");
    });
    $("#end_voice_call").click(function () {
        partChatChannel();
        $(".chatBg").find(".chat_content").css("height", "80%");
        $(".chatBg").find(".writing").css("bottom", "0");
    });

    $("#accept_video_call").click(function () {
        $(".chatBg").find("#accept_video_call").css("display", "none");
        $(".chatBg").find("#refuse_video_call").css("display", "none");
        $(".chatBg").find("#end_video_call").css("display", "block");
        joinCalling();
    });
    $("#refuse_video_call").click(function () {
        partChatChannel();
    });
    $("#end_video_call").click(function () {
        partChatChannel();
    });

    $("#accept_group_voice_call").click(function () {
        $(".chatBg").find("#accept_group_voice_call").css("display", "none");
        $(".chatBg").find("#refuse_group_voice_call").css("display", "none");
        $(".chatBg").find("#end_group_voice_call").css("display", "block");
        joinCalling();
    });
    $("#refuse_group_voice_call").click(function () {
        partChatChannel();
    });
    $("#end_group_voice_call").click(function () {
        partChatChannel();
    });

    $("#accept_group_video_call").click(function () {
        $(".chatBg").find("#accept_group_video_call").css("display", "none");
        $(".chatBg").find("#refuse_group_video_call").css("display", "none");
        $(".chatBg").find("#end_group_video_call").css("display", "block");
        joinCalling();
    });
    $("#refuse_group_video_call").click(function () {
        partChatChannel()
    });
    $("#end_group_video_call").click(function () {
        partChatChannel();
    });

    $("#invite").click(function () {
        if (!visibleInvitePopup) {
            visibleInvitePopup = true;
            $.post('/getInviteUrl', {
                channel: channel
            }, function (data, status) {
                if (status === "success") {
                    $("#invite_popup").find("input[name='invite_url']").val(
                        window.location.protocol + "//" + window.location.hostname + ":" +
                        window.location.port + "/" + channel + "/" + data);
                    $("#invite_popup").css("display", "block");
                } else {
                    alert("err>>>" + status);
                }
            });
        } else {
            visibleInvitePopup = false;
            $("#invite_popup").css("display", "none");
        }
    });

    $(".full_screen").click(function () {
        $(this).hide();
        $(".default_screen").show();
        if (isGroup) {
            $(this).parents(".group_voice_call_monitor").addClass("fullMonitor");
            $(this).parents(".group_video_call_monitor").find(".whole").addClass("fullVideoView");
        } else {
            $(this).parents(".voice_call_monitor").addClass("fullMonitor");
            $(this).parents(".video_call_monitor").find(".whole").addClass("fullVideoView");
        }
        $(this).parents(".chatBg").addClass("fullBg");
        $(".nav").hide();
        $(".info").hide();
        $(".infoBg").hide();
    });
    $(".default_screen").click(function () {
        $(this).hide();
        $(".full_screen").show();
        if (isGroup) {
            $(this).parents(".group_voice_call_monitor").removeClass("fullMonitor");
            $(this).parents(".group_video_call_monitor").find(".whole").removeClass("fullVideoView");

        } else {
            $(this).parents(".voice_call_monitor").removeClass("fullMonitor");
            $(this).parents(".video_call_monitor").find(".whole").removeClass("fullVideoView");
        }
        $(this).parents(".chatBg").removeClass("fullBg");
        $(".nav").show();
        $(".info").show();
        $(".infoBg").show();
    });

    $(".screen_sharing").click(function () {
        if ($(this).attr("class") === "screen_sharing") {  // beginning screen sharing
            $(this).addClass("activeScreenSharing");
            start_screen_share();
        } else {                                          // ending screen sharing
            $(this).removeClass("activeScreenSharing");
            cancelSharingScreen();
        }
    });

    $(".mic").click(function () {
        if ($(this).attr("class") === "mic") {
            $(this).addClass("micTurnedOff");
            offAudio();
        } else {
            $(this).removeClass("micTurnedOff");
            onAudio();
        }
    });
    $(".back_first").click(function () {
        $(".screen").css("display", "none");
        $("#screen1").css("display", "block");
        $(".screen2").css("display", "none");
        $(".screen3").css("display", "none");
        $(".screen4").css("display", "none");
        $(".screen5").css("display", "none");
        $(".contact_profile").css("display", "block");
        localStorage.setItem("helpPage", "seen");
        $(".nav").find("ul.calls").find(".db").click();
    })

    if (localStorage.getItem("helpPage") !== "seen") {
        $(".help1").click();
    }
    //initialize
    $(".nav").find(".calls").find(".db").click();

});

function new_voicecall() {
    voiceCallStyle();
    if (isGroup) {
        $(".chatBg").find(".group_voice_call_monitor").css("display", "block");
        requestCalling(true, false);
    } else {
        $(".chatBg").find(".voice_call_monitor").css("display", "block");
        requestCalling(false, false);
    }
}

function new_videocall() {
    videoCallStyle();
    if (isGroup) {
        $(".chatBg").find(".group_video_call_monitor").css("display", "block");
        requestCalling(true, true);
    } else {
        $(".chatBg").find(".video_call_monitor").css("display", "block");
        requestCalling(false, true);
    }
}

function voiceCallStyle() {
    if (window.innerWidth <= 992) {
        $(".full_screen").click();
        $(".chatBg").addClass("callingScreen");
    }
    $(".default_screen").hide();
    $(".screen").css("z-index", "10");
    $(".screen").css("display", "block");
    $(".nav").css("z-index", "9");
    $(".chatBg").find(".chat_content").css("height", "50%");
    $(".chatBg").find(".writing").css("bottom", "300px");
    $("#accept_voice_call").css("display", "none");
    $("#refuse_voice_call").css("display", "none");
    $("#end_voice_call").css("display", "block");
    $("#accept_group_voice_call").css("display", "none");
    $("#refuse_group_voice_call").css("display", "none");
    $("#end_group_voice_call").css("display", "block");
    $(".chatBg").find(".voice_call_monitor").css("display", "none");
    $(".chatBg").find(".group_voice_call_monitor").css("display", "none");
}

function videoCallStyle() {
    if (window.innerWidth <= 992) {
        $(".full_screen").click();
        $(".chatBg").addClass("callingScreen");
    }
    $(".default_screen").hide();
    $(".screen").css("z-index", "10");
    $(".nav").css("z-index", "9");
    $(".screen").css("display", "block");
    $(".chatBg").css("background", "#ffffff");
    $(".chatBg").css("padding", "0");
    $(".chatBg").find(".chat_content").css("display", "none");
    $(".chatBg").find(".writing").css("display", "none");
    $("#accept_video_call").css("display", "none");
    $("#refuse_video_call").css("display", "none");
    $("#end_video_call").css("display", "block");
    $("#accept_group_video_call").css("display", "none");
    $("#refuse_group_video_call").css("display", "none");
    $("#end_group_video_call").css("display", "block");
    $(".chatBg").find(".video_call_monitor").css("display", "none");
    $(".chatBg").find(".group_video_call_monitor").css("display", "none");
}

function defaultStyle() {
    blockable = false;
    onCalling = false;
    timingStop();
    endRing();

    $("#invite").css("display", "none");

    $(".waiting_screen").show();
    $(".screen").css("z-index", "-10");
    $(".nav").css("z-index", "20");
    $(".screen").css("display", "none");
    $(".chatBg").css({
        "background": "url('../images/bgPattern.png') repeat",
        "padding": "50px 0"
    });
    $(".chatBg").find(".chat_content").css("display", "block");
    $(".chatBg").find(".writing").css("display", "block");
    $(".chatBg").find(".chat_content").css("height", "80%");
    $(".chatBg").find(".writing").css("bottom", "0");
    $(".chatBg").find(".group_video_call_monitor").css("display", "none");
    $(".chatBg").find(".group_voice_call_monitor").css("display", "none");
    $(".chatBg").find(".voice_call_monitor").css("display", "none");
    $(".chatBg").find(".video_call_monitor").css("display", "none");
    $(".nav").find(".calls").find(".db").click();
    hang_audio.play();
    localVideoContainer.html("");
    groupVideoContainer.find("#group_self_video").html("");
    remoteLargeVideoContainer.html("");
    remoteGroupLargeVideoContainer.html("");

}

function convertTime(now_time) {
    var last_time;
    var today = new Date();
    var date = new Date(now_time);
    var diff = today.getTime() - date.getTime();
    var oneday = 24 * 3600 * 1000;
    if (diff < oneday) {
        last_time = date.getHours() + ":" + date.getMinutes();
    } else if (diff < 2 * oneday) {
        last_time = "1 day ago";
    } else if (diff < 30 * oneday) {
        last_time = Math.floor(diff / oneday) + " days ago";
    } else if (diff < 61 * oneday) {
        last_time = "1 month ago";
    } else if (diff < 365 * oneday) {
        last_time = Math.floor(diff / (30.5 * oneday)) + " months ago";
    }
    return last_time;
}