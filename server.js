/// <reference path="typings/node/node.d.ts"/>
var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var logger = require('morgan');
var flash = require('connect-flash');
var schedule = require("node-schedule");
var http=require('http');

var config = require('./config/config');
var robot = require('./controllers/grabcontroller');

var accessLog = fs.createWriteStream('access.log', { flags: 'a' });
var app = express();

var approute = require('./route');

//加上这一段可以用req.body.xx去解析form表单中字段
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '100mb'
}));

//view engine jade
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));


//每天定时
/*
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(0, 6)];
rule.hour = 9;
rule.minute = 56;

var j = schedule.scheduleJob(rule, function () {
    console.log('begin to grab.....');
    robot.grabHtml();
});
*/

//每小时在30分种的时候抓取
// var rule = new schedule.RecurrenceRule();
// rule.minute = 1;
// 
// var j = schedule.scheduleJob(rule, function () {
//     console.log('running.....');
//     robot.RunGrab();
// });

app.use('/', approute);

// 捕捉404错误
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

app.listen(config.port, config.host, function () {
    console.log(new Date());
    console.log('在端口:' + app.get('port') + '监听!');
    robot.RunGrab();
});
