require('dotenv').config();
const fs = require('fs');

if(!fs.existsSync("./.env")) {
  console.log(".env file not found. Quitting");
  process.exit(1);
}

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cookieSession = require('cookie-session');

var app = express();
app.use(cookieSession({
  name: 'session',
  secret: process.env['SESSION_SECRET']
}))

/*
uncomment for https
const port = 3000;
const https = require('https');
var key = fs.readFileSync(__dirname + '/../certs/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/../certs/selfsigned.crt');
var options = {
  key: key,
  cert: cert
};

var server = https.createServer(options, app);

server.listen(port, () => {
  console.log("server starting on port : " + port)
});*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var loginRouter = require('./routes/login');
var recordRouter = require('./routes/record.js');
var userRouter = require('./routes/user');
var galleryRouter = require('./routes/gallery');

app.use('/', loginRouter);

app.use(function(req, res, next) {
  if (!req.session.ks) {
      res.redirect('/');
      return;
  }
  next();
});


app.use('/record', recordRouter);
app.use('/user', userRouter);
app.use('/gallery', galleryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
