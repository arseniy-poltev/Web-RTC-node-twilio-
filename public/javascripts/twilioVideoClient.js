let isSetLocalTrack = false;
let isVideoCall = false;
let channel;
var accessToken;
let activeRoom;
let timePicker;
let participantsElements = {};
let group_members = [];
let onCalling = false;
let remoteMembersLength;

/**
 * rings
 */
let ring_audio = new Audio('../audio/call.mp3');
ring_audio.loop = true;
let message_audio = new Audio('../audio/message.mp3');

/**
 * 1:1 video call placing video container
 */
let localVideoContainer;
let remoteLargeVideoContainer;
/**
 * group video call placing video container
 */
let groupVideoContainer;
let remoteGroupLargeVideoContainer;

/**
 * screen sharing
 */
let screenLocalTrack;
let sharing = false;

$(document).ready(function () {
    //////////////-----------------------------------1:1 video and audio chatting ----------------------------------
    /**
     * 1:1 Video call views
     */
    localVideoContainer = $(".video_call_monitor").find('.right_bottom').find("#self_video");
    remoteLargeVideoContainer = $('.video_call_monitor').find("#remote_video");

    groupVideoContainer = $("#customer").find("#customers");
    remoteGroupLargeVideoContainer = $(".group_video_call_monitor").find("#group_video");
});

function getSmallVideoElement(userId) {
    return blockable ? $(
        "<div " +
        "class='hover_video' " +
        "onmouseover='hoverBlockIcon($(this))' " +
        "onmouseleave='hideBlockIcon($(this))'>" +
        "<div class='block_user'>" +
        "<img " +
        "class='img-responsive' " +
        "onclick='displayModalBlockUser(" + '"' + userId + '"' + ")' " +
        "src='../images/trogj_03vid_btn_kick.png'>" +
        "</div>" +
        "</div>") : $("<div class='hover_video' />");
}

socket
    .on('members', function (data) {
        if (data.length > 0) {
            group_members = [];
            data.forEach(item => {
                group_members.push(item.userid.toString());
            })
        }
    })
    .on("group_call", function (data) {
        if (id === data.userid) {
            if (data.isGroup) {
                blockable = true;
                $("#invite").css("display", "block");
                socket.emit("getVideoToken", id);
            }
        } else {
            if (data.isGroup) {
                for (var i = 0; i < data.members.length; i++) {
                    if (data.members[i] == id) {
                        if (!onCalling) {
                            onCalling = true;
                            group_members = data.members;
                            isGroup = data.isGroup;
                            channel = data.channel;
                            isVideoCall = data.isVideoCall;
                            startRing();
                            if (isVideoCall) {
                                videoCallStyle();
                                $(".chatBg").find(".group_video_call_monitor").find("#accept_group_video_call").css("display", "inline-block");
                                $(".chatBg").find(".group_video_call_monitor").find("#refuse_group_video_call").css("display", "inline-block");
                                $(".chatBg").find(".group_video_call_monitor").find("#end_group_video_call").css("display", "none");
                                $(".chatBg").find(".group_video_call_monitor").css("display", "block");
                            } else {
                                voiceCallStyle();
                                $(".chatBg").find(".group_voice_call_monitor").find("#accept_group_voice_call").css("display", "inline-block");
                                $(".chatBg").find(".group_voice_call_monitor").find("#refuse_group_voice_call").css("display", "inline-block");
                                $(".chatBg").find(".group_voice_call_monitor").find("#end_group_voice_call").css("display", "none");
                                $(".chatBg").find(".group_voice_call_monitor").css("display", "block");
                            }
                        }

                    }
                }
            } else {
                if (data.fid == id) {
                    isGroup = data.isGroup;
                    channel = data.channel;
                    isVideoCall = data.isVideoCall;
                    fid = data.userid;
                    startRing();
                    if (isVideoCall) {
                        videoCallStyle();
                        $(".chatBg").find("#accept_video_call").css("display", "inline-block");
                        $(".chatBg").find("#refuse_video_call").css("display", "inline-block");
                        $(".chatBg").find("#end_video_call").hide();
                        $(".chatBg").find(".video_call_monitor").css("display", "block");
                    } else {
                        voiceCallStyle();
                        $(".chatBg").find("#accept_voice_call").css("display", "inline-block");
                        $(".chatBg").find("#refuse_voice_call").css("display", "inline-block");
                        $(".chatBg").find("#end_voice_call").css("display", "none");
                        $(".chatBg").find(".voice_call_monitor").css("display", "block");
                    }
                }
            }
        }
    })
    .on("already created", function () {
        socket.emit("getVideoToken", id);
    })
    .on("token", function (token) {
        accessToken = token;
        startCalling();
    })
    .on("accepted", function (config) {
        if (!config.isGroup && config.userid !== id) {
            socket.emit("getVideoToken", id);
        }
    })
    .on("end_call", partedChatChannel)
    .on('removePeer', function (partChannel) {
        if (channel === partChannel) {
            $("#blockedUserModal").modal({backdrop: "static"});
            partedChatChannel(partChannel);
        }
    })
    .on("reconnect", (attemptNumber) => {
        socket.emit("check_online", id);
    })
    .on("disconnect", function (reason) {
        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });

function requestCalling(boolGroup, boolVideo) {
    startRing();
    isVideoCall = boolVideo;
    isGroup = boolGroup;
    if (isGroup) {
        channel = isVideoCall ? gid + "G" : gid + "GA";
        socket.emit('startCall', {
            "channel": channel,
            'userid': id,
            'members': group_members,
            'isVideoCall': isVideoCall,
            'isGroup': isGroup
        });
    } else {
        channel = isVideoCall ? singleid : singleid + "A";
        socket.emit('startCall', {
            "channel": channel,
            'userid': id,
            'fid': fid,
            'isVideoCall': isVideoCall,
            'isGroup': isGroup
        });
    }
}

function joinCalling() {
    if (isGroup) {
        socket.emit('join', {
            "channel": channel,
            'userid': id,
            'members': group_members,
            'isVideoCall': isVideoCall,
            'isGroup': isGroup
        });

    } else {
        socket.emit('join', {
            "channel": channel,
            'userid': id,
            'fid': fid,
            'isVideoCall': isVideoCall,
            'isGroup': isGroup
        });
    }
}

function partChatChannel() {
    roomDisconnect();
    socket.emit('part', channel);
    socket.emit('check_online', id);
    defaultStyle();
}

function partedChatChannel(partChannel) {
    if (channel === partChannel) {
        sharing = false;
        isSetLocalTrack = false;
        roomDisconnect();
        defaultStyle();
        socket.emit('check_online', id);
    }
}

function roomDisconnect() {
    if (activeRoom) {
        activeRoom.disconnect();
        activeRoom = null;
    }
}

function startCalling() {
    Twilio.Video.connect(accessToken, {
        name: channel,
        type: "group",
        audio: true,
        video: isVideoCall
    }).then(room => {
        activeRoom = room;
        // Attach the Tracks of the room's participants.
        attachLocalTracks(activeRoom.localParticipant);
        $(".waiting_screen").hide();
        room.participants.forEach(publishRemoteParticipant);
        endRing();
        if (isGroup)
            isVideoCall ? timing($("#time")) : timing($("#time2"));
        else
            isVideoCall ? timing($("#time3")) : timing($("#time1"));
        // Participant joining room
        room.on('participantConnected', publishRemoteParticipant);

        // Detach all participant’s track when they leave a room.
        room.on('participantDisconnected', participant => {
            var tracks = Array.from(participant.tracks.values());
            tracks.forEach(track => removeRemoteTrack(participant, track, true))
        });

        // Once the local participant leaves the room, detach the Tracks
        // of all other participants, including that of the LocalParticipant.
        room.on('disconnected', () => {
            for (let identity in participantsElements) {
                delete participantsElements[identity];
            }
            groupVideoContainer.find("#group_self_video").children().remove();
            remoteLargeVideoContainer.children().remove();
            remoteGroupLargeVideoContainer.children().remove();
            localVideoContainer.children().remove();

            participantsElements = {};
            $("#sharing_video").find("video").remove();
            $("#sharedScreenModal").modal("hide");
        });
    }).catch(error => {
        console.error(`Unable to connect to Room: ${error}`);
        alert(`Unable to connect to Room: ${error.message}`);
        endRing();
        hang_audio.play();
        socket.emit("part", channel);
        window.location.reload();
    });
}

function attachLocalTracks(localParticipant) {
    if (!isSetLocalTrack) {
        isSetLocalTrack = true;
        var tracks = Array.from(localParticipant.tracks.values());
        if (isGroup) {
            tracks.forEach(publishedTrack => {
                if (publishedTrack.track.kind === "video") {
                    groupVideoContainer.find("#group_self_video").html(publishedTrack.track.attach());
                    remoteGroupLargeVideoContainer.html(publishedTrack.track.attach());
                    if (remoteGroupLargeVideoContainer.children("video").innerWidth < remoteGroupLargeVideoContainer.children("video").innerHeight) {
                        remoteGroupLargeVideoContainer.children("video").addClass("mobileRemote");
                    }
                }
            });
        } else {
            tracks.forEach(publishedTrack => {
                if (publishedTrack.track.kind === "video") {
                    localVideoContainer.html(publishedTrack.track.attach());
                    localVideoContainer.children("video").css({
                        "width": "100%", "height": "100%"
                    });
                }
            });
        }
    }
}

function publishRemoteParticipant(participant) {
    participant.on('trackSubscribed', track => {
        if (participant.identity in participantsElements) {
            if ("video" in participantsElements[participant.identity])
                addScreenVideoTrack(participant, track);
            else
                addRemoteTrack(participant, track);
        } else {
            participantsElements[participant.identity] = {};
            addRemoteTrack(participant, track);
        }
    });
    participant.on('trackUnsubscribed', track => {
        removeRemoteTrack(participant, track, false);
    });
}

function addRemoteTrack(participant, track) {
    if (isGroup) {
        if (track.kind === "video") {
            const smallVideo = getSmallVideoElement(participant.identity);
            smallVideo.prepend(track.attach());
            groupVideoContainer.append(smallVideo);
            remoteGroupLargeVideoContainer.find("video").css("display", "none");
            remoteGroupLargeVideoContainer.append(track.attach());

            const membersLength = groupVideoContainer.children(".hover_video").siblings(".hover_video").length;
            remoteMembersLength = remoteGroupLargeVideoContainer.find("video").siblings("video").length;

            participantsElements[participant.identity]["video"] = [];
            participantsElements[participant.identity]["video"].push(groupVideoContainer.children(".hover_video").siblings(".hover_video").eq(membersLength - 1));
            participantsElements[participant.identity]["video"].push(remoteGroupLargeVideoContainer.find("video").siblings("video").eq(remoteMembersLength - 1));
        } else {
            groupVideoContainer.append(track.attach());
            const membersLength = groupVideoContainer.children(".hover_video").siblings("audio").length;
            participantsElements[participant.identity]["audio"] = groupVideoContainer.children(".hover_video").siblings("audio").eq(membersLength - 1);
        }
    } else {
        if (track.kind === "video") {
            attachLocalTracks(activeRoom.localParticipant);
            remoteLargeVideoContainer.html(track.attach());
            if (remoteLargeVideoContainer.children("video").innerWidth < remoteLargeVideoContainer.children("video").innerHeight) {
                remoteLargeVideoContainer.children("video").addClass("mobileRemote");
            }
            $(".waiting_screen").hide();
        } else {
            $('.video_call_monitor').append(track.attach());
        }
    }
}

function removeRemoteTrack(participant, track, isLeft) {
    if (isGroup) {
        if (participant.identity in participantsElements) {
            if ("screen" in participantsElements[participant.identity]) {
                removeScreenVideoTrack(participant)
            } else {
                if (track.kind in participantsElements[participant.identity]) {
                    if (track.kind === "video") {
                        participantsElements[participant.identity][track.kind].forEach(videoElement => {
                            videoElement.remove();
                        });
                        remoteMembersLength = remoteGroupLargeVideoContainer.find("video").siblings("video").length;
                        remoteGroupLargeVideoContainer.find("video").siblings("video").eq(remoteMembersLength - 1).css("display", "block");
                    } else {
                        participantsElements[participant.identity][track.kind].remove()
                    }
                }
            }
            if (isLeft) {
                delete participantsElements[participant.identity];
            }
        }
    }
}

function addScreenVideoTrack(participant, track) {
    sharing = true;
    $("#sharedScreenModal").modal({backdrop: "static"});
    $("#sharing_video").html(track.attach());
    participantsElements[participant.identity]["screen"] = $("#sharing_video").find("video");
}

function removeScreenVideoTrack(participant) {
    $("#sharedScreenModal").modal("hide");
    $("#sharing_video").html("");
    sharing = false;
    delete participantsElements[participant.identity]["screen"];
}

function offAudio() {
    var tracks = Array.from(activeRoom.localParticipant.audioTracks.values());
    tracks.forEach(publishedTrack => {
        publishedTrack.track.disable();
    })
}

function onAudio() {
    var tracks = Array.from(activeRoom.localParticipant.audioTracks.values());
    tracks.forEach(publishedTrack => {
        publishedTrack.track.enable();
    })
}

////////////////////////////////////////////////-------screen sharing ----------------------------------------
function isFirefox() {
    var mediaSourceSupport = !!navigator.mediaDevices.getSupportedConstraints().mediaSource;
    var matchData = navigator.userAgent.match(`/Firefox/(d) /`);
    var firefoxVersion = 0;
    if (matchData && matchData[1]) {
        firefoxVersion = parseInt(matchData[1], 10);
    }
    return mediaSourceSupport && firefoxVersion >= 52;
}

function isChrome() {
    return 'chrome' in window;
}

function canScreenShare() {
    return isFirefox() || isChrome();
}

function start_screen_share() {
    if (!canScreenShare()) {
        return;
    }
    if (isChrome()) {
        getScreenConstraints(function (error, screen_constraints) {
            if (error) {
                if (confirm("Your browser can't support to share your screen.\n" +
                    "Will you install chrome extension for sharing screen?")) {
                    window.open("https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk");
                }
                $(".screen_sharing").removeClass("activeScreenSharing");
                console.log(error);
                return;
            }
            navigator.mediaDevices.getUserMedia({
                video: screen_constraints
            })
                .then(stream => {
                    screenLocalTrack = new Twilio.Video.LocalVideoTrack(stream.getVideoTracks()[0]);
                    activeRoom.localParticipant.publishTrack(screenLocalTrack);
                })
                .catch(error => {
                    console.log(error);
                });
        });
    } else if (isFirefox()) {
        navigator.mediaDevices.getUserMedia({
            video: {
                mediaSource: 'screen'
            }
        }).then(stream => {
            screenLocalTrack = new Twilio.Video.LocalVideoTrack(stream.getVideoTracks()[0]);
            activeRoom.localParticipant.publishTrack(screenLocalTrack);
        }).catch(error => {
            console.log(error);
        });
    }
}

function cancelSharingScreen() {
    if (screenLocalTrack) {
        activeRoom.localParticipant.unpublishTrack(screenLocalTrack);
    }
}

/////////////////////////////////block user/////////////////////////////////////////

function blockUser(userId) {
    socket.emit('remove', {"channel": channel, "user_id": userId});
}

function hoverBlockIcon(elem) {
    elem.find(".block_user").css("display", "block");
}

function hideBlockIcon(elem) {
    elem.find(".block_user").css("display", "none");
}

function displayModalBlockUser(user_id) {
    $("#blockUserModal").modal({backdrop: 'static'});
    $("#blockUserModal").find("input[name='user_id']").val(user_id);
    $("#blockUserModal").find("div").find("span").text(user_id);
}

function startRing() {
    ring_audio.play();
}

function endRing() {
    ring_audio.pause();
}

function messageReceive() {
    message_audio.play();
}

function timing(element) {
    var total = 0, hour = 0, min1 = 0, min2 = 0, s1 = 0, s2 = 0;
    timePicker = setInterval(function () {
        total++;
        var s = total % 60;
        s1 = Math.floor(s / 10);
        s2 = s % 10;
        var mm = Math.floor(total / 60);
        var min = mm % 60;
        min1 = Math.floor(min / 10);
        min2 = min % 10;
        hour = Math.floor(min / 60);
        element.text(hour + ":" + min1 + min2 + ":" + s1 + s2);
    }, 1000);
}

function timingStop() {
    clearInterval(timePicker);
}