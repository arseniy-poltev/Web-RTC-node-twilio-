/**
 * Created by User on 7/13/2018.
 */
var flagContact=true;
var global_numOfList=0;
var clickedElementGroupid;
var your_id;
$(document).ready(function () {
    //left side
    $("#contact_modal").find(".close").click(function () {
        $(".nav").find(".db").click();
    });
    $("#contact_modal").find(".modal-footer").find("#new_chat").click(function () {
        if(flagContact){
            var newid=$(this).parent().siblings(".modal-body").find(".activeList").find("input").val();
            $.get('/api/addNewChat/'+id+'/'+newid,function (data, status) {
                if(status==="success"){
                    new_friend(id,newid,data);
                    $("#contact_modal").modal("hide");
                    $(".nav").find(".calls").find("li:first").click();
                }else{
                    alert("err>>>"+status);
                }
            });
        }else{
            var item_user;
            var users=[];
            for(var i=0;i<global_numOfList;i++){
                item_user=$(this).parent().siblings(".modal-body").find("li").eq(i);
                if(item_user.attr("class")==="activeList"){
                    users.push(item_user.find("input[name='userid']").val());
                }
            }
            $.post('/api/createNewGroup/',{
                id:id,
                data:JSON.stringify(users)
            },function (data, status) {
                if(status=="success"){
                    new_Group(id,data.groupid,data.newMsg,data.name);
                    console.log(">>>groupid>>"+data);
                    $("#contact_modal").modal("hide");
                    $(".nav").find(".calls").find("li:first").click();
                }else{
                    alert("err>>>"+status);
                }
            },"json");
        }
    });
    $("#setting_modal").find(".close").click(function () {
        $(".nav").find(".db").click();
    });
    $("#setting_modal").find(".modal-footer").find("#updatePwd").click(function () {
        var oldpass=$(this).parent().siblings(".modal-body").find("input[name='old']");
        var newpass=$(this).parent().siblings(".modal-body").find("input[name='new']");
        var confirmpass=$(this).parent().siblings(".modal-body").find("input[name='confirm']");
        toastr.options.timeOut=1000;
        if(oldpass.val()===""){
            toastr.options.onHidden=function () {
                oldpass.focus();
            };
            toastr.info("Please enter old password");
        }else if(newpass.val()===""){
            toastr.options.onHidden=function () {
                newpass.focus();
            };
            toastr.info("Please enter new password");
        }else if(confirmpass.val()===""){
            toastr.options.onHidden=function () {
                confirmpass.focus();
            };
            toastr.info("Please confirm new password");
        }else{
            if(newpass.val()!==confirmpass.val()){
                confirmpass.val("");
                toastr.options.onHidden=function () {
                    confirmpass.focus();
                };
                toastr.info("Please reconfirm your new password");
            }else{
                $.post('/api/updatePassword/',{
                    userid:id,
                    old_pass:oldpass.val(),
                    new_pass:newpass.val()
                },function (data, status) {
                    if(status==="success"){
                        if(data=="fail"){
                            toastr.options.onHidden=function () {
                                oldpass.val("");
                                newpass.val("");
                                confirmpass.val("");
                                oldpass.focus();
                            };
                            toastr.error("Wrong Old Password!\nPlease Reenter Your Old Password");
                        }else{
                            toastr.options.onHidden=function () {
                                $("#setting_modal").modal("hide");
                                $(".nav").find(".db").click();
                            };
                            toastr.success("Updated your password successfully");
                        }
                    }else{
                        alert("error>>>"+status);
                    }
                },"json");
            }
        }
    });
    $("#help_modal").find(".close").click(function () {
        $(".nav").find(".db").click();
    });
    $("#help_modal").find(".modal-footer").find("#submithelp").click(function () {
        var submit_text=$("#help_modal").find(".modal-body").find("textarea");
        if(submit_text.val()===""){
            toastr.options.timeOut=1000;
            toastr.options.onHidden=function () {
                submit_text.val("");
                submit_text.focus();
            };
            toastr.error("Please Enter Content to Submit to Administrator");
        }else{
            $.post("/api/submit/",{
                userid:id,
                content:submit_text.val()
            },function (data, status) {
                if(status==="success"){
                    $("#help_modal").modal("hide");
                    $(".nav").find(".db").click();
                }else{
                    alert("error>>>"+status);
                }
            },"json");
        }
    });

    //right side//////////////////////////////////////////////
    $("#addToGroup_modal").find(".close").click(function () {
        $(this).parents(".modal").modal("hide");
    });
    $("#addToGroup_modal").find(".modal-footer").find("#add_new_member").click(function () {
        var groupid=$(this).parent().siblings(".modal-body").find(".activeList").find("input").val();
        $.get('/api/addCurrentMember/'+your_id+'/'+groupid,function (data, status) {
            if(status==="success"){
                toastr.options.timeOut=1000;
                toastr.options.onHidden=function () {
                    $("#addToGroup_modal").modal("hide");
                }
                toastr.success("Added Successfully");
            }else{
                alert("err>>>"+status);
            }
        });
    });
    $("#leftGroup_modal").find(".modal-footer").find(".close").click(function () {
        $(this).parents(".modal").modal("hide");
    });
    $("#leftGroup_modal").find(".modal-footer").find("#leave").click(function () {
        $.get("/api/leftGroup/"+clickedElementGroupid+"/"+id,function (data,status) {
            if(status==="success"){
                toastr.options.onHidden=function () {
                    socket.emit('leftRoom',{
                        myid:id,
                        groupid:clickedElementGroupid,
                        group:true
                    });
                    window.location.reload();
                };
                toastr.success("You have been removed from the group");
            }else{
                alert("error>>>"+status);
            }
        });
    });
    $("#removeFromContactList_modal").find(".modal-footer").find("#remove").click(function () {
        $.get("/api/removeMember/"+your_id+"/"+id,function (data,status) {
            if(status==="success"){
                socket.emit('leftRoom',{
                    myid:id,
                    yourid:your_id,
                    group:false
                });
                toastr.options.onHidden=function () {
                    window.location.reload();
                };
                toastr.success("The user has been removed from your contact");
            }else{
                alert("error>>>"+status);
            }
        });
    });
    $("#addMember_modal").find(".modal-footer").find(".close").click(function () {
        $(this).parents(".modal").modal("hide");
    });
    $("#addMember_modal").find(".modal-footer").find("#add").click(function () {
        var item_user;
        var users=[];
        for(var i=0;i<global_numOfList;i++){
            item_user=$(this).parent().siblings(".modal-body").find("li").eq(i);
            if(item_user.attr("class")==="activeList"){
                users.push(item_user.find("input[name='userid']").val());
            }
        }
        $.post('/api/addMembersToGroup/',{
            groupid:clickedElementGroupid,
            data:JSON.stringify(users)
        },function (data, status) {
            if(status=="success"){
                $("#addMember_modal").modal("hide");

                $(".infoBg").find(".contact_profile").find(".detail_title").text("Members("+data.length+")");

                var usernames='';
                for(var i=0;i<data.length;i++){
                    usernames+=data[i].username+", ";
                }
                $(".infoBg").find(".contact_profile").find(".detail_content").text(usernames);
            }else{
                alert("err>>>"+status);
            }
        },"json");
    });
    $("#blockUserModal").find(".sure").click(function () {
        // alert($(this).siblings("input").val());
        $("#blockUserModal").modal("hide");
        console.log("user_id>>>",$(this).siblings("input[name='user_id']").val());
        blockUser($(this).siblings("input[name='user_id']").val());
    });
    $("#blockUserModal").find(".close1").click(function () {
        $("#blockUserModal").modal("hide")
    });
    $("#blockedUserModal").find(".quit").click(function () {
        $("#blockedUserModal").modal("hide")

        // window.location.reload();
    });
});
function selectNewUser(element){
    flagContact=true;
    $("#new_chat").removeAttr("disabled");
    $("#add_new_member").removeAttr("disabled");
    element.siblings("li").css("background","rgba(255,255,255,0)");
    element.addClass("activeList");
}
function createNewGroup(element,numList){
    flagContact=false;
    global_numOfList=numList;
    $("#new_chat").removeAttr("disabled");
    $("#add").removeAttr("disabled");
    if(element.attr("class")==="activeList"){
        element.find("input[type='checkbox']").removeAttr("checked");
        element.removeClass("activeList");
        var flagEnabledStartButton=false;
        for(var i=0;i<numList;i++){
            if(element.siblings("li").eq(i).attr("class")==="activeList"){
                flagEnabledStartButton=true;
            }
        }
        if(!flagEnabledStartButton){
            $("#new_chat").attr("disabled","disabled");
            $("#add").attr("disabled","disabled");
        }
    }else{
        element.addClass("activeList");
        element.find("input[type='checkbox']").attr("checked","checked");
    }
}
function DisplayGroups(yourid) {
    var content="";
    your_id=yourid;
    $.get("/api/getGroupsForMeNotYou/"+id+"/"+yourid,function (data, status) {
        if(status==="success"){
            if (data.length>0){
                content+='<ul>';
                for(var i=0;i<data.length;i++){
                    content+='<div class="divider"></div>' +
                        '<li onclick="selectNewUser($(this))">' +
                        '<img src="../images/trogj_02db_icn_group_online.png">' +
                        '<input type="hidden" name="groupid" value="'+data[i].groupid+'">' +
                        '<span>'+data[i].groupname+'</span>' +
                        '</li>';
                }
                content+='<ul>';
                $("#addToGroup_modal").find(".modal-body").html(content);
                $("#addToGroup_modal").modal({backdrop:"static"});
            }else {
                toastr.options.timeOut=2000;
                toastr.warning("No Group That the User didn't join");
            }
        }else{
            alert("err">>>status);
        }
    });
}
function RemoveMember(yourid) {
    your_id=yourid;
    $("#removeFromContactList_modal").modal({backdrop:"static"});
}
function DisplayNonMembers(element,groupid) {
    var content = "";
    clickedElementGroupid=groupid;
    $.get("/api/getNewMembers/" + element.siblings("input").val(),
        function (data, status) {
            if (status === "success") {
                if (data.length > 0) {
                    content += '<ul>';
                    for (var i = 0; i < data.length; i++) {
                        content += '<div class="divider"></div>' +
                            '<li onclick="createNewGroup($(this),' + data.length + ')">' +
                            '<input type="checkbox">' +
                            '<img src="./images/trogj_02db_icn_user_online.png">' +
                            '<input type="hidden" name="userid" value="' + data[i].userid + '">' +
                            '<span>' + data[i].username + '</span>' +
                            '<i class="onlineSate">Offline</i>' +
                            '</li>'
                    }
                    content += '<ul>';
                    $("#addMember_modal").find(".modal-body").html(content);
                    $("#addMember_modal").modal({backdrop: "static"});
                }else{
                    toastr.options.timeOut=2000;
                    toastr.warning("There is no User to Add to This Group.\n" +
                        "All Users were joined here.")
                }
            } else {
                alert("err" >>> status);
            }
        });
}
function DisplayWarning(groupid) {
    clickedElementGroupid=groupid;
    $("#leftGroup_modal").modal({backdrop:"static"});
}