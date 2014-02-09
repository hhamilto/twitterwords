$(document).ready(function(){
    $('#submit').click(function(e){
        $.ajax({
            url: '/set_twitter_user',
            method: 'POST',
            data: {
                username: $('#username').val()
            }
        })
    });
    $('#command').keyup(function(e){
        if(e.which==13){
            $.ajax({
                url:'/command',
                method: 'POST',
                data:{
                    command: $('#command').val()
                },
                dataType: 'text'
            }).done(function(data){
                $('#console').append(data+'\n');
            });
            $('#command').val('');
        }
    });
});