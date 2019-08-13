var socket = io();
var channel;
let id;
let hang_audio = new Audio('../audio/hang.mp3');
let isSetLocalTrack = false;
var accessToken;
let activeRoom;
let participantsElements = {};

/**
 * group video call placing video container
 */
let groupVideoContainer;
let remoteGroupLargeVideoContainer;

$(document).ready(function () {
    channel = $("[name='channel']").val();
    id = generateRandomID(2);
    groupVideoContainer = $("#customer").find("#customers");
    remoteGroupLargeVideoContainer = $("#group_video");

    alert("You are about to join the call as a guest");

    socket.emit("check_online",id);
    socket.emit('join', {
        "channel": channel,
        'userid': id,
        'members': "",
        'isVideoCall': true,
        'isGroup': true
    });

    $("#blockedUserModal").find(".quit").click(function () {
        $("#blockedUserModal").modal("hide")
        // window.location.reload();
    });
    socket
        .on("already created", function () {

            socket.emit("getVideoToken", id);
        })
        .on("token", function (token) {
            accessToken = token;
            startCalling();
        })
        .on("end_call", partedChatChannel)
        .on('removePeer', function (partChannel) {
            if (channel === partChannel) {
                $("#blockedUserModal").modal({backdrop: "static"});
                partedChatChannel(partChannel);
            }
        })
        .on("disconnect", function () {
            console.log("Disconnected from signaling server");
        });

    function partedChatChannel(partChannel) {
        if (channel === partChannel) {
            isSetLocalTrack = false;
            roomDisconnect();
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
            audio: true,
            video: true
        }).then(room => {
            activeRoom = room;
            timing($("#time"));

            // Attach the Tracks of the room's participants.
            room.participants.forEach(publishRemoteParticipant);
            // Participant joining room
            room.on('participantConnected', publishRemoteParticipant);

            // Detach all participant’s track when they leave a room.
            room.on('participantDisconnected', participant => {
                var tracks = Array.from(participant.tracks.values());
                tracks.forEach(track => removeRemoteTrack(participant, track))
            });

            // Once the local participant leaves the room, detach the Tracks
            // of all other participants, including that of the LocalParticipant.
            room.on('disconnected', () => {
                for (let identity in participantsElements) {
                    delete participantsElements[identity];
                }
                groupVideoContainer.find("#group_self_video").children().remove();
                remoteGroupLargeVideoContainer.children().remove();

                participantsElements = {};
            });
        }).catch(error => {
            console.error(`Unable to connect to Room: ${error}`);
            alert(`Unable to connect to Room: ${error.message}`);
            hang_audio.play();
            socket.emit("part", channel);
            window.location.reload();
        });
    }

    function attachLocalTracks(localParticipant) {
        if (!isSetLocalTrack) {
            isSetLocalTrack = true;
            var tracks = Array.from(localParticipant.tracks.values());
            tracks.forEach(publishedTrack => {
                if (publishedTrack.track.kind === "video") {
                    groupVideoContainer.find("#group_self_video").html(publishedTrack.track.attach());
                    remoteGroupLargeVideoContainer.html(publishedTrack.track.attach());
                    if (remoteGroupLargeVideoContainer.children("video").innerWidth < remoteGroupLargeVideoContainer.children("video").innerHeight) {
                        remoteGroupLargeVideoContainer.children("video").addClass("mobileRemote");
                    }
                }
            });
        }
    }

    function publishRemoteParticipant(participant) {
        participant.on('trackSubscribed', track => {
            addRemoteTrack(participant, track);
        });
        participant.on('trackUnsubscribed', track => {
            removeRemoteTrack(participant, track);
        });
    }

    function addRemoteTrack(participant, track) {
        participantsElements[participant.identity] = {};
        if (track.kind === "video") {
            attachLocalTracks(activeRoom.localParticipant);
            const smallVideo = $("<div class='hover_video' />");
            smallVideo.prepend(track.attach());
            groupVideoContainer.append(smallVideo);
            const membersLength = groupVideoContainer.children(".hover_video").siblings(".hover_video").length;
            participantsElements[participant.identity]["video"] = groupVideoContainer.children(".hover_video").siblings(".hover_video").eq(membersLength - 1);
        } else {
            groupVideoContainer.append(track.attach());
            const membersLength = groupVideoContainer.children(".hover_video").siblings("audio").length;
            participantsElements[participant.identity]["audio"] = groupVideoContainer.children(".hover_video").siblings("audio").eq(membersLength - 1);
        }
    }

    function removeRemoteTrack(participant, track) {
        if (participantsElements[participant.identity][track.kind]) {
            participantsElements[participant.identity][track.kind].remove()
        }
    }

    socket.on('cancel', function () {
        $(".screen").css("z-index", "-10");
        $(".nav").css("z-index", "20");
        $(".screen").css("display", "none");
        $(".chatBg").css({
            "background": 'url("../images/bgPattern.png") no-repeat center',
            'background-size': 'cover',
            "padding": "50px 0"
        });
        $(".chatBg").find(".chat_content").css("display", "block");
        $(".chatBg").find(".writing").css("display", "block");
        $(".chatBg").find(".group_video_call_monitor").css("display", "none");
        $(".chatBg").find(".group_voice_call_monitor").css("display", "none");
        window.location.reload();
    });

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
});
function generateRandomID(val) {
    var newRandomID='';
    var str='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0;i<val;i++){
        newRandomID+=str.charAt(Math.floor(Math.random()*62));
    }
    return newRandomID;
}