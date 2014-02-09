#! /usr/bin/nodejs
var express = require('express');
var fs = require('fs');
var OAuth = require('oauth');
var OAuth2 = OAuth.OAuth2;
var app = express();
app.use(express.bodyParser());

var twitterConsumerKey = '7Z7lbRsLWqVWzU7Ncg7Klw';
var twitterConsumerSecret = ' x0F0HC4uoUnjWuMfFbZZU87WMf83UCcSlGDfMEQQsP0';
var oauth2 = new OAuth2(twitterConsumerKey,
  twitterConsumerSecret, 
  'https://api.twitter.com/', 
  null,
  'oauth2/token', 
  null);
oauth2.getOAuthAccessToken(
  '',
  {'grant_type':'client_credentials'},
  function (e, access_token, refresh_token, results){
  console.log('bearer: ',access_token);
  done();
});


/*** OLD STUFF */

var generateUuid = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

app.use(express.static(__dirname + '/public'));

app.get('/stats', function(req, res){
  console.log('runnin: ' + req.query.id);
  var obj = bag[req.query.id]
  obj.ans = obj.fun.apply(null, obj.args);
  if(!(typeof obj.ans == "object" || typeof obj.ans == "array"))
    obj.ans = [obj.ans];
  obj.dependents.map(function(d){
    d.obj.args[d.argIndex] = obj.ans[d.retKey];
  });
  res.send({
    ans: obj.ans
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

app.get('/all', function(req, res){
  res.send(bag);
});

app.listen(8080);

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(word) {
  word = word.trim().replace(/(\r\n|\n|\r)/gm,"");
  console.log(freqMap[word]?freqMap[word].freq.toFixed(6)+"/"+freqMap[word].count:'NOT FOUND');
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