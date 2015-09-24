#! /usr/bin/nodejs
var express = require('express');
var fs = require('fs');
var OAuth = require('oauth');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var OAuth2 = OAuth.OAuth2;
var app = express();

var generateUuid = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
	genid: generateUuid,
	secret: 'HAYGUYZIMMASECRET'
}));

var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  '7Z7lbRsLWqVWzU7Ncg7Klw',
  'x0F0HC4uoUnjWuMfFbZZU87WMf83UCcSlGDfMEQQsP0',
  '1.0A',
  null,
  'HMAC-SHA1'
);


app.use(express.static(__dirname + '/public'));
var workingData = {};

var commets = {};
app.get('/commet', function(req,res){
  commet = commets[req.sessionID] = commets[req.sessionID] || {};
  commet.toSend = commet.toSend || [];
  commet.res = res;
  if(commet.toSend.length > 0){
    console.log("shitballs, we got data here! SENDIN IT.");
    res.send(commet.toSend);
    commet.toSend = [];
    commet.res = undefined;
  }else{
    commet.resHardExpireTimeout = setTimeout(function(){
      res.send([]);
      commet.res = undefined;
    },30000);
  }
})

var commetSend = function(sessionId,data){
  console.log('commet sendin: ' + data + " to " + sessionId);
  commet = commets[sessionId] = commets[sessionId] || {};
  console.log('res = ' + commet.res);
  if(commet.res){
    commet.res.send([data]);
    clearTimeout(commet.resHardExpireTimeout)
    commet.resHardExpireTimeout = undefined
    commet.res = undefined
  }else{
    commet.toSend = commet.toSend || []
    commet.toSend.push(data);
  }
};

app.post('/set_twitter_user', function(req, res){
  req.body.username = req.body.username[0]=='@'?req.body.username.slice(1):req.body.username;
  var baseCompletePercent = 10,
      finalPercent = 80,
      incrementPercent = 10;
  oauth.get(
        'https://api.twitter.com/1.1/users/show.json?screen_name='+req.body.username,
        '2334327559-7nTCMJCfzkxxpGzaL5Bo8e3khaCasdJiB0g7AUC', //test user token
        'wtY0moheFIah1wSOOzKOLpf1Fc5WLTsoKmMnurFpoy5RC', //test user secret            
        function(e, data){
          if(e){
            res.send({
              error: "Couldn't find the user"
            });
            return;
          }
          data = JSON.parse(data);
          var numReqsNeeded = Math.ceil(data.statuses_count/200);
          incrementPercent = (finalPercent-baseCompletePercent)/numReqsNeeded;
          httpTweets();
          res.send(data);
        });

  var tweets = [], timelineSec;
  var processTweets = function (e, data, res){
    console.log("processing tweets");
    if (e) console.error(e);
    timelineSec = JSON.parse(data);
    tweets = tweets.concat(timelineSec);
    if(timelineSec.length > 1){
      // try to get mo
      console.log("tweet: "+timelineSec[0].text+'\n.\n');
      commetSend(req.sessionID,{
        type:'STATUS',
        task: 'fetch tweets',
        status: 'PROGRESS',
        percentDone: baseCompletePercent+=incrementPercent});
      httpTweets();
    }else{
      commetSend(req.sessionID,{
        type:'STATUS',
        task: 'fetch tweets',
        status: 'PROGRESS',
        percentDone: finalPercent,
        message:"Grabbed Tweets"});
      analizeTweets(req.sessionID, tweets);
    }
  };
  var httpTweets = function(){oauth.get(
        'https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name='+req.body.username+(timelineSec?'&max_id='+timelineSec[timelineSec.length-1].id_str:''),
        '2334327559-7nTCMJCfzkxxpGzaL5Bo8e3khaCasdJiB0g7AUC', //test user token
        'wtY0moheFIah1wSOOzKOLpf1Fc5WLTsoKmMnurFpoy5RC', //test user secret            
        processTweets
        )};
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
  if(word[0] == '/'){
    command = word.slice(1).match(/\w+/g);
    if(command[0] == 'help'){
      res.send("*** COMMAND LISTING ***\n"+
               " /help     - Displays this list \n"+
               " /top [n]  - Displays top n words. defaults to top 10 and excludes 100 most common words in english \n"+
               "*** END COMMAND LIST***");
    }else if(command[0] == 'top'){
      command[1] = command[1] || 10;
      res.send(wd.freqArr.slice(0,command[1]).reduce(function(p,c,i){
        return p+(i+1)+") "+ c.word + ": " +c.freq.toFixed(6)+"/"+c.count +'\n'
      },'TOP '+command[1]+' WORDS:\n'));
    }
  }else{
    res.send(wd.freqMap[word]?wd.freqMap[word].freq.toFixed(6)+"/"+wd.freqMap[word].count + " :" + word:'!NOT FOUND :' + word);
  }
});


app.listen(3000);

if(process.argv[3]){

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(word) {
    word = word.trim().replace(/(\r\n|\n|\r)/gm,"");
  });
}

var freqMap = {};
var freqArr = [];

var analizeTweets = function(sessionID, tweets){
  setTimeout(function(){
      try{
        console.log("thinkin on da tweets");
        var wd = workingData[sessionID] = {};
        var freqMap = wd.freqMap = {};
        var freqArr = wd.freqArr = [];
        var dups = {};
        tweets = tweets.filter(function(t){
          return dups[t.id_str]?false:dups[t.id_str]=true;
        });
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
            freq:freqMap[word].freq,
            count:freqMap[word].count
          });
        }
        freqArr.sort(function(a,b){
          return a.freq < b.freq?1:-1;
        });
        commetSend(sessionID,{
          type:'STATUS',
          task: 'fetch tweets',
          status: 'DONE',
          percentDone: 100,
          message:"Tweets Processed"});
        }catch(e){
        commetSend(sessionID,{
          type:'STATUS',
          task: 'fetch tweets',
          status: 'ERROR',
          percentDone: 100,
          message:"couldn't process tweets. perhaps the user didn't have any?"});
        }
      },0)
}

console.log('Listening on port 3000');

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
