const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
let channels = {};
const accountSid = "AC2a952eb068b34a2e538ca8a12f47e073";
const apiKey = "SKb25ed60064cfacf8f1f3ec6fe6c618d0";
const apiSecretKey = "l7k9SaHvzFLQUolTjRyLTJ5YukAaic9H";
module.exports = function (io) {
    io.on("connection", function (socket) {
        socket.channels = {};
        socket
            .on("getVideoToken", function (identity) {
                // Create Video Grant
                const videoGrant = new VideoGrant();

                // Create an access token which we will sign and return to the client,
                // containing the grant we just created
                const token = new AccessToken(
                    accountSid, //account sid
                    apiKey, // api key
                    apiSecretKey      // secret key
                );
                token.addGrant(videoGrant);
                token.identity = identity;
                socket.emit("token", token.toJwt());
            })
            .on("startCall", function (config) {
                var channel = config.channel;
                if (channel in channels) {
                    if (config.isGroup) {
                        console.log("[" + socket.userid + "] join ", config);
                        socket.emit("already created");
                    } else {
                        delete channels[channel];
                        console.log("[" + socket.userid + "] start ", config);
                        channels[channel] = {};
                        io.sockets.emit('group_call', config);
                    }
                } else {
                    console.log("[" + socket.userid + "] start ", config);
                    channels[channel] = {};
                    io.sockets.emit('group_call', config);
                }
                channels[channel][socket.userid] = socket;
                socket.channels[channel] = channel;
                console.log("start calling >>>current channel(", channel, ")'s sockets>>>", Object.keys(channels[channel]));
            })
            .on('join', function (config) {
                console.log("[" + socket.userid + "] join ", config);
                var channel = config.channel;
                if (channel in channels) {
                    console.log("[" + socket.userid + "] join ", config);
                    socket.emit("already created");
                    if (!config.isGroup) {
                        for (let id in channels[channel]) {
                            channels[channel][id].emit("accepted", config);
                        }
                    }
                    channels[channel][socket.userid] = socket;
                    socket.channels[channel] = channel;
                    console.log("joining>>>current channel(", channel, ")'s sockets>>>", Object.keys(channels[channel]));
                } else {
                    console.log("[" + socket.userid + "] ERROR: not in ", channel);
                }
            })
            .on("part", function (channel) {
                partSocketInThisChannel(channel);
                console.log("current channel(", channel, ")'s keys>>>", Object.keys(channels));
                if (channels[channel]) {
                    console.log("part>>>current channel(", channel, ")'s sockets>>>", Object.keys(channels[channel]));
                    if (Object.keys(channels[channel]).length <= 1) {
                        partChannel(channel);
                    }
                }
            })
            .on("remove", blockUser);

        function partSocketInThisChannel(channel) {
            console.log("deleting current channel[", channel, "] from socket>>[", socket.userid, "]");
            if (channels[channel])
                if (socket.userid in channels[channel])
                    delete channels[channel][socket.userid];
            if (socket.channels)
                if (channel in socket.channels)
                    delete socket.channels[channel];
        }

        function partChannel(channel) {

            for (let id in channels[channel]) {
                if (channel in channels[channel][id].channels)
                    delete channels[channel][id].channels[channel];
            }
            console.log("end calling>>>channel>>", channel);
            io.sockets.emit("end_call", channel);
            delete channels[channel];
        }

        function blockUser(blockData) {
            console.log("[" + blockData.user_id + "] part ");
            if (!(blockData.channel in channels)) {
                console.log("this user to block ERROR: not in ", blockData.channel);
                return;
            }

            if (!(blockData.user_id in channels[blockData.channel])) {
                console.log("[" + blockData.user_id + "] ERROR: not in ", blockData.channel)
                return;
            }
            channels[blockData.channel][blockData.user_id].emit("removePeer", blockData.channel);
            delete channels[blockData.channel][blockData.user_id];
            console.log("blocked>>>blocking user>>", socket.userid, ">>>>blocked user>>>", blockData.user_id);
            if (Object.keys(channels[blockData.channel]).length <= 1) {
                partChannel(blockData.channel);
            }
        }
    });
};