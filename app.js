var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , Hashids = require('hashids')
  , url = require('url')
  , hashids
  , rClient;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  hashids = new Hashids("arr! the brine of the sea!");
  hostname = '127.0.0.1:3000';
}

rClient = redis.createClient(app.get('redis-port'), app.get('redis-host'));
rClient.auth(app.get('redis-pass'), function(err) {
  if (err) { throw err; }
});

app.get('/', routes.index);

app.get('/l/:hash', function (req, res) {
  rClient.get(req.params.hash, function(err, url) {
    if (err) {
      res.send(500);
    } else {
      if (url === null) {
        res.send(404);
      } else {
        console.log('Going to ' + url);
        res.redirect(301, url);
      }
    }
  });
});

app.post('/l', function(req, res) {
  if (req.body.url.trim() === '') {
    res.send(400);
  }

  urlObj = url.parse(req.body.url);
  if (urlObj.protocol === null) {
    urlObj = url.parse('http://' + req.body.url);
  }

  if (urlObj.host === null || urlObj.host === hostname) {
    res.send(400);
  }

  rClient.get('nextId', function(err, nextId) {
    var hash;

    if (err) {
      res.send(500);
    } else {
      hash = hashids.encrypt(parseInt(nextId));
      hashUrl = url.format({
        protocol: 'http',
        host: hostname,
        pathname: '/l/' + hash
      });

      rClient.set(hash, req.body.url, function(err) {
         if (err) {
           res.send(500);
         } else {
           rClient.incr('nextId');
           res.json({hash: hashUrl, url: urlObj.href});
         }
      });
    }
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
