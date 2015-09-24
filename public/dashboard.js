var dfdPen = {
    pen: {},
    get: function(id){
        if(!this.pen[id])
            this.pen[id] = new jQuery.Deferred();
        return this.pen[id];
    },
    clear: function(){
        this.pen = {};
    }
};

$(document).ready(function(){
    $('#submit').click(function(e){
        $.ajax({
            url: '/set_twitter_user',
            method: 'POST',
            data: JSON.stringify({
                username: $('#username').val()
            }),
            contentType: 'application/json',
            dataType:'json'
        }).done(function(data){
            if(data.error){
                alert(data.error);
                return;
            }
            $('#numTweets .data-val').text(' '+data.statuses_count);
            $('#user-profile-pic img').attr('src',data.profile_image_url);
            $('#getitbar > .progress-bar').css('width','10%');//XXX add the whole aria thing
            $('#getitbar').slideDown();
            $('#command').prop('disabled', true);
            dfdPen.clear();
            dfdPen.get('fetch tweets').progress(function(data){
                $('#getitbar > .progress-bar').css('width',data.percentDone+'%');
                data.message && printToC(data.message);
            }).done(function(data){
                $('#command').prop('disabled', false);
                $('#getitbar').slideUp();
                data.message && printToC(data.message);
            }).fail(function(data){
                $('#getitbar').slideUp();
                data.message && printToC(data.message),alert(data.message);
            })
        });
        
    });
    
    $('#command').keyup(function(e){
        if(e.which==13){
            $.ajax({
                url:'/command',
                method: 'POST',
                cache: false,
                data: JSON.stringify({
                    command: $('#command').val()
                }),
                contentType: 'application/json',
                dataType: 'text'
            }).done(function(data){
                printToC(data);
            });
            $('#command').val('');
        }
    })
    $('#command').prop('disabled', true);

    var commet = function(){
        $.ajax({
            url: '/commet',
            cache: false,
            dataType: 'json'
        }).done(function(data){
            data.map(function(datum){
                if(datum.type == 'STATUS'){
                    if(datum.status == 'DONE')
                        dfdPen.get(datum.task).resolve(datum);
                    else if (datum.status == 'PROGRESS')
                        dfdPen.get(datum.task).notify(datum);
                    else if (datum.status == 'ERROR')
                        dfdPen.get(datum.task).reject(datum);
                }else{
                    console.log("didn't recognize the data that was sent :/");
                }
            });
            commet();
        }).fail(function(error){
            console.log('commet got fucked, so we are going to fucking chill for a bit instead of freakin out.');
            setTimeout(commet,5000);
        });
    };
    commet();
});

var printToC = function(string){
    $('#console').append(string+'\n');
    var consoleEl = $('#console').get(0);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}
