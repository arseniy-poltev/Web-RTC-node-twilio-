const db = require('../dbconnection');
const crypto = require('crypto');

const users = {
    login: function (userInfo, callback) {
        return db.query("SELECT * FROM users WHERE username=? AND password=?",
            [userInfo.username, crypto.createHash('sha256').update(userInfo.password).digest('base64')], callback);
    },
    insertOTP: function (userid, otp, callback) {
        return db.query("UPDATE users SET otp=? WHERE userid=? ", [otp, userid], callback);
    },
    getOTP: function (userid, callback) {
        return db.query("SELECT * FROM users WHERE userid=?", [userid], callback);
    },
    getUsername: function (userid, callback) {
        return db.query("SELECT username FROM users WHERE userid=?",
            [userid], callback);
    },
    getFriendList: function (myid, callback) {
        return db.query("SELECT d.*, roomid as singleid " +
            "FROM (SELECT s.*,users.username,users.image_url " +
            "FROM (SELECT * FROM `singlechat` WHERE sender=? OR receiver=?) s " +
            "LEFT JOIN users " +
            "on s.sender=? AND users.userid=s.receiver " +
            "OR s.receiver=? AND users.userid=s.sender " +
            "ORDER BY send_time DESC) d, singlerooms " +
            "WHERE singlerooms.user1=d.sender AND singlerooms.user2=d.receiver " +
            "OR singlerooms.user2=d.sender AND singlerooms.user1=receiver", [myid, myid, myid, myid], callback);
    },
    getGroupList: function (myid, callback) {
        return db.query("SELECT groupchat.*,groups.groupname,g.received " +
            "FROM groupchat, " +
            "(SELECT groupid,received FROM grouprooms WHERE userid=?) g, " +
            "groups " +
            "WHERE g.groupid=groups.groupid " +
            "and g.groupid=groupchat.groupid " +
            "ORDER BY groupchat.send_time DESC", [myid], callback);
    },
    getMessages: function (myid, friendid, callback) {
        return db.query("SELECT singlechat.*,users.username " +
            "FROM singlechat,users " +
            "WHERE singlechat.sender=? and singlechat.receiver=? and users.userid=?" +
            "or singlechat.sender=? and singlechat.receiver=? and users.userid=? order by send_time",
            [myid, friendid, myid, friendid, myid, friendid], callback);
    },
    getGroupMessages: function (groupid, callback) {
        return db.query("SELECT groupchat.*,users.username FROM groupchat,users WHERE groupchat.groupid=? and " +
            "groupchat.userid=users.userid order by send_time", [groupid], callback);
    },
    getRoomNo: function (myid, friendid, callback) {
        return db.query("SELECT roomid FROM singlerooms " +
            "WHERE user1=? AND user2=? OR user1=? AND user2=?",
            [myid, friendid, friendid, myid], callback);
    },
    getUsersGroupRoom: function (groupid, callback) {
        return db.query("SELECT grouprooms.userid,users.username FROM grouprooms,users WHERE grouprooms.groupid=? and grouprooms.userid=users.userid", [groupid], callback);
    },
    getUsernamesGroupRoom: function (groupid, callback) {
        return db.query("SELECT users.userid,users.username FROM grouprooms,users " +
            "WHERE grouprooms.groupid=? AND " +
            "users.userid=grouprooms.userid", [groupid], callback);
    },
    recordMessaging: function (myid, yourid, msg, callback) {
        return db.query("INSERT INTO singlechat (sender,receiver, content,send_time,received) " +
            "values(?,?,?,now(),0)", [myid, yourid, msg], callback);
    },
    saveAttachedFile: function (user_id, groupIdOrFriendId, url, isGroup, callback) {
        return db.query("INSERT INTO uploadedfiles (user_id,groupIdOrFriendId,url,isGroup) VALUES(?,?,?,?)",
            [user_id, groupIdOrFriendId, url, isGroup], callback);
    },
    isAttachedFile: function (user_id, groupIdOrFriendId, isGroup, url, callback) {
        if (isGroup) {
            return db.query("SELECT * FROM uploadedfiles WHERE user_id=? AND groupIdOrFriendId=? AND isGroup=? AND url=?",
                [user_id, groupIdOrFriendId, isGroup, url], callback);
        } else {
            return db.query("SELECT * FROM uploadedfiles WHERE user_id=? AND groupIdOrFriendId=? AND isGroup=? AND url=? " +
                "OR user_id=? AND groupIdOrFriendId=? AND isGroup=? AND url=?",
                [user_id, groupIdOrFriendId, isGroup,url, groupIdOrFriendId, user_id, isGroup,url], callback);
        }
    },
    getAttachedFile: function (user_id, groupIdOrFriendId, isGroup, callback) {
        if (isGroup) {
            return db.query("SELECT * FROM uploadedfiles WHERE user_id=? AND groupIdOrFriendId=? AND isGroup=?",
                [user_id, groupIdOrFriendId, isGroup], callback);
        } else {
            return db.query("SELECT * FROM uploadedfiles WHERE user_id=? AND groupIdOrFriendId=? AND isGroup=? " +
                "OR user_id=? AND groupIdOrFriendId=? AND isGroup=?",
                [user_id, groupIdOrFriendId, isGroup, groupIdOrFriendId, user_id, isGroup], callback);
        }
    },
    removeAttachedFile: function (user_id, groupIdOrFriendId, isGroup, callback) {
        if (isGroup) {
            return db.query("DELETE FROM uploadedfiles WHERE user_id=? AND groupIdOrFriendId=? AND isGroup=?",
                [user_id, groupIdOrFriendId, 1], callback);
        } else {
            return db.query("DELETE FROM uploadedfiles WHERE user_id=? AND groupIdOrFriendId=? AND isGroup=? " +
                "OR user_id=? AND groupIdOrFriendId=? AND isGroup=?",
                [user_id, groupIdOrFriendId, isGroup, groupIdOrFriendId, user_id, isGroup], callback);
        }

    },
    getUnreadToRead: function (myid, friendid, callback) {
        return db.query("UPDATE singlechat SET received=1 " +
            "WHERE sender=? and receiver=? ", [friendid, myid], callback);
    },
    getUnreadToReadInGroup: function (myid, groupid, callback) {
        return db.query("UPDATE grouprooms SET received=1 " +
            "WHERE groupid=? and userid=?", [groupid, myid], callback);
    },
    //new coding

    getFriendid: function (myid, roomid, callback) {
        return db.query("(SELECT user1 as user from singlerooms " +
            "WHERE roomid=? and user2=?) " +
            "UNION " +
            "(SELECT user2 as user from singlerooms " +
            "WHERE roomid=? and user1=? )", [roomid, myid, roomid, myid], callback);
    },
    // apis used in modals
    getNewUsers: function (userid, callback) {
        return db.query("SELECT users.userid, users.username FROM users " +
            "where userid not IN " +
            "(SELECT user1 as userid FROM singlerooms WHERE user2=? " +
            "UNION " +
            "(SELECT user2 as userid from singlerooms WHERE user1=?)) " +
            "and users.userid!=?", [userid, userid, userid], callback);
    },
    getAllUsers: function (myid, callback) {
        return db.query("SELECT userid,username FROM users WHERE userid!=?", [myid], callback);
    },
    addNewChat: function (myid, newid, callback) {
        return db.query("INSERT INTO singlerooms (user1,user2) " +
            "values(?,?)", [myid, newid], callback);
    },
    recordMessageToGroup: function (groupid, userid, content, callback) {
        return db.query("INSERT INTO groupchat (groupid,userid, content,send_time) " +
            "values(?,?,?,now())", [groupid, userid, content], callback);
    },
    getGroupName: function (callback) {
        return db.query("SELECT COUNT(*) as numGroup FROM groups", callback);
    },
    createNewGroup: function (groupname, createrid, callback) {
        return db.query("INSERT INTO groups (groupname, created_time,createrid) " +
            "values(?,NOW(),?)", [groupname, createrid], callback);
    },
    addMemberToGroup: function (groupid, userid, callback) {
        return db.query("INSERT INTO grouprooms (groupid,userid,received) " +
            "values(?,?,0)", [groupid, userid], callback);
    },
    getGroupId: function (groupname, callback) {
        return db.query("SELECT groupid FROM groups WHERE groupname=?",
            [groupname], callback);
    },
    exactableOldPass: function (userid, callback) {
        return db.query("SELECT password FROM users WHERE userid=?", [userid], callback);
    },
    updatePassword: function (userid, new_pass, callback) {
        return db.query("UPDATE users SET password=? " +
            "WHERE userid=?",
            [crypto.createHash('sha256').update(new_pass).digest('base64'),
                userid], callback);
    },
    getAdminPhone: function (adminid, callback) {
        return db.query("SELECT phonenum FROM admin WHERE id=?", [adminid], callback);
    },
    getNewMemberOfGroup: function (groupid, callback) {
        return db.query("SELECT userid,username FROM users " +
            "WHERE userid not in (SELECT userid from grouprooms WHERE groupid=?)",
            [groupid], callback);
    },
    // add member about individual user:
    getGroupsForMeNotYou: function (myid, yourid, callback) {
        return db.query("SELECT groups.groupid,groups.groupname " +
            "FROM grouprooms,groups " +
            "WHERE groups.groupid=grouprooms.groupid and " +
            "grouprooms.userid=? and grouprooms.groupid not in " +
            "(SELECT groupid from grouprooms WHERE userid =?)", [myid, yourid], callback);
    },
    // addMembersToGroup about Group selection:
    removeUserFromGroupRoom: function (groupid, userid, callback) {
        return db.query("DELETE FROM grouprooms WHERE groupid=? AND userid=?",
            [groupid, userid], callback);
    },
    removeHistoryFromGroupChat: function (groupid, userid, callback) {
        return db.query("DELETE FROM groupchat WHERE groupid=? AND userid=?",
            [groupid, userid], callback);
    },
    getAttachedFileFromGroup: function (groupIdOrFriendId, isGroup, callback) {
        return db.query("SELECT * FROM uploadedfiles WHERE groupIdOrFriendId=? AND isGroup=?",
            [groupIdOrFriendId, isGroup], callback);
    },
    removeAttachedFileFromGroup: function (groupIdOrFriendId, isGroup, callback) {
        return db.query("DELETE FROM uploadedfiles WHERE groupIdOrFriendId=? AND isGroup=?",
            [groupIdOrFriendId, isGroup], callback);
    },
    removeGroup: function (groupid, callback) {
        return db.query("DELETE FROM groups WHERE groupid=?", [groupid], callback);
    },
    addCurrentMember: function (yourid, groupid, callback) {
        return db.query("INSERT INTO grouprooms (groupid,userid,received) " +
            "value(?,?,0)", [groupid, yourid], callback);
    },
    removeRoomFromSingleRoom: function (id1, id2, callback) {
        return db.query("DELETE FROM singlerooms WHERE user1=? and user2=? or user2=? and user1=?",
            [id1, id2, id1, id2], callback);
    },
    deleteChattingHistory: function (id1, id2, callback) {
        return db.query("DELETE FROM singlechat WHERE sender=? and receiver=? or receiver=? and sender=?",
            [id1, id2, id1, id2], callback);
    }
};
module.exports = users;
