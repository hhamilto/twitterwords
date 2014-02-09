#! /usr/bin/nodejs
var express = require('express');
var fs = require('fs');
var OAuth = require('oauth');
var OAuth2 = OAuth.OAuth2;
var app = express();
app.use(express.bodyParser());

var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  '7Z7lbRsLWqVWzU7Ncg7Klw',
  'x0F0HC4uoUnjWuMfFbZZU87WMf83UCcSlGDfMEQQsP0',
  '1.0A',
  null,
  'HMAC-SHA1'
);

var generateUuid = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

app.use(express.static(__dirname + '/public'));
var commets = {};
var workingData = {};
app.get('/data', function(req,res){
  commet = commets[req.sessionID] = commets[req.sessionID] || {};
  commet.res = res;
  if(commet.toSend.length > 0){
    res.send(commet.toSend);
    commet.toSend = [];
  }else{
    setTimeout(function(){
      res.send([]);
      commet.res = undefined;
    },30000);
  }
})

var commetSend = function(sessionId,data){
  commet = commets[sessionId] = commets[sessionId] || {};
  if(commet.res){
    res.send([data]);
    commet.res = undefined
  }else{
    commet.toSend = commet.toSend || []
    commet.toSend.push(data);
  }
};

app.post('/set_twitter_user', function(req, res){
  var tweets = [];
  var processTweets = function (e, data, res){
    console.log("processing tweets");
    if (e) console.error(e);
    var timelineSec = JSON.parse(data);
    tweets = tweets.concat(timelineSec);
    if(timelineSec.length > 1){
      // try to get mo
      console.log("tweet: "+timelineSec[0].text);
      oauth.get(
        'https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name='+req.body.username+'&max_id='+timelineSec[timelineSec.length-1].id_str,
        '2334327559-7nTCMJCfzkxxpGzaL5Bo8e3khaCasdJiB0g7AUC', //test user token
        'wtY0moheFIah1wSOOzKOLpf1Fc5WLTsoKmMnurFpoy5RC', //test user secret            
        processTweets
        );
    }else{
      commetSend(req.sessionID,{type:'STATUS', message:"done grabbing tweets"});
      setTimeout(function(){
        console.log("thinkin on da tweets");
        var wd = workingData[req.sessionID] = {};
        var freqMap = wd.freqMap = {};
        var freqArr = wd.freqArr = [];
        wd.tweets = tweets;
        var text = tweets.reduce(function(p,tweet){
          return p + tweet.text + ' ';
        },'');
        var words = String(text).match(/[\w']+/g);
        var distinctWords = 0;
        words.map(function(w){
          w = w.toLowerCase();
          if(w.match(/^\d+$/))return;
          if(freqMap[w]){
            //console.log("saw " + w+ " again.");
            freqMap[w]++;
          }else{
            freqMap[w] = 1;
            distinctWords++;
          }
        });
        for(word in freqMap){
          freqMap[word] = {
            freq: freqMap[word]/distinctWords*100,
            count: freqMap[word]
          }
          if(excludes.reduce(function(p, w){
                 return p || word.match(new RegExp("^"+w+"$"));
          },false)) continue;
          freqArr.push({
            word: word,
            freq:freqMap[word].freq
          });
        }
        freqArr.sort(function(a,b){
          return a.freq < b.freq?1:-1;
        });
        commetSend(req.sessionID,{type:'STATUS', message:"tweets Processed"});
      },0)
    }
  };
  oauth.get(
    'https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name='+req.body.username,
    '2334327559-7nTCMJCfzkxxpGzaL5Bo8e3khaCasdJiB0g7AUC', //test user token
    'wtY0moheFIah1wSOOzKOLpf1Fc5WLTsoKmMnurFpoy5RC', //test user secret            
    processTweets
    );
  res.send({
    id: "getinIT"
  });
});

app.post('/connect', function(req, res){
  var from = bag[req.body.fromId];
  var to = bag[req.body.toId];
  from.dependents.push({
    obj: to,
    argIndex: req.body.argIndex,
    retKey: req.body.retKey
  });
  res.send({msg:"yay"});
});

app.post('/command', function(req, res){
  var wd = workingData[req.sessionID];
  var word = req.body.command
  res.send(wd.freqMap[word]?wd.freqMap[word].freq.toFixed(6)+"/"+wd.freqMap[word].count + " :" + word:'!NOT FOUND!');
});


app.listen(8080);

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(word) {
  word = word.trim().replace(/(\r\n|\n|\r)/gm,"");
  var wd;
  for(sid in workingData){
    wd = workingData[sid];
    break;
  }
  console.log(wd.freqMap[word]?wd.freqMap[word].freq.toFixed(6)+"/"+wd.freqMap[word].count:'NOT FOUND');
  /*if( == 's'){
    fs.writeFile("savedObjs.json", JSON.stringify(bag), function(err) {
      if(err) {
          console.log(err);
      } else {
          console.log("The file was saved!");
      }
    });   
  }*/
});

var freqMap = {};
var freqArr = [];

// readin a save file if present
if(process.argv[2]){
  /*fs.readFile(process.argv[2], function (err, data) {
    if (err) throw err;
    var words = String(data).match(/[\w']+/g);
    var distinctWords = 0;
    words.map(function(w){
      w = w.toLowerCase();
      if(w.match(/^\d+$/))return;
      if(freqMap[w]){
        //console.log("saw " + w+ " again.");
        freqMap[w]++;
      }else{
        freqMap[w] = 1;
        distinctWords++;
      }
    });
    for(word in freqMap){
      freqMap[word] = {
        freq: freqMap[word]/distinctWords*100,
        count: freqMap[word]
      }
      if(excludes.reduce(function(p, w){
             return p || word.match(new RegExp("^"+w+"$"));
      },false)) continue;
      freqArr.push({
        word: word,
        freq:freqMap[word].freq
      });
    }

    freqArr.sort(function(a,b){
      return a.freq < b.freq?1:-1;
    });
    console.log("num words = " + freqArr.length);
    freqArr.slice(0,20).map(function(w){
      console.log(w.freq + " " + w.word);
    });
    /*console.log(freqArr[0].word);
    console.log(freqArr[1].word);
    console.log(freqMap["sarina"]);*/


    //console.log('loaded the fuck out of ' + process.argv[2]);
  //});
}


console.log('Listening on port 80');


var excludes = [

"aug",
"mar",
"feb",
"apr",
"jan",
"jun",
"sep",
"jul",
"dec",
"oct",
"nov",
"com",

"the",
"of",
"and",
"a",
"to",
"in",
"is",
"you",
"that",
"it",
"he",
"was",
"for",
"on",
"are",
"as",
"with",
"his",
"they",
"I",
"at",
"be",
"this",
"have",
"from",
"or",
"one",
"had",
"by",
"word",
"but",
"not",
"what",
"all",
"were",
"we",
"when",
"your",
"can",
"said",
"there",
"use",
"an",
"each",
"which",
"she",
"do",
"how",
"their",
"if",
"will",
"up",
"other",
"about",
"out",
"many",
"then",
"them",
"these",
"so",
"some",
"her",
"would",
"make",
"like",
"him",
"into",
"time",
"has",
"look",
"two",
"more",
"write",
"go",
"see",
"number",
"no",
"way",
"could",
"people",
"my",
"than",
"first",
"water",
"been",
"call",
"who",
"oil",
"its",
"now",
"find",
"long",
"down",
"day",
"did",
"get",
"come",
"made",
"may",
"part"]