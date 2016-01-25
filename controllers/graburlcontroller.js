var cheerio = require('cheerio');
var request = require('request');
var Iconv = require('iconv').Iconv;
var iconv = new Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');
var fs = require('fs');
var path = require('path');
var config = require('../config/config');
var GrabURLModel = require('../models/URLModel');
var rand = Math.floor(Math.random() * 100000000).toString();

//抓取所有的分页链接
exports.grabAllPageURL = function (req, res, next) {
    request.get({ url: config.grab_config.hostname, encoding: null }, function (error, response, body) {
        console.log('ready to grab....');
        if (!error && response.statusCode == 200) {
            //如果主站是ok的，则任务继续
            var $ = cheerio.load(body);
            if (config.grab_config.haslastpage) {
                //抓取最后一页的页码
                if (config.grab_config.pageid) {
                    console.log($('#' + config.grab_config.pageid).find('a').last().text());
                }
                else {
                    var lastpageurl = $('.' + config.grab_config.pageclass).eq(0).find('a').eq(config.grab_config.lastpageofa).attr('href');
                    //取出最后一个页码
                    var reg = /[0-9]+(?=[^0-9]*$)/;
                    var lastpagenum = parseInt(reg.exec(lastpageurl)[0]);
                    for (var i = 0; i < lastpagenum; i++) {
                        var obj = {
                            graburl: config.grab_config.sinlepagepattern + '' + (i + 1),
                            isgrabed: false,
                            lastgrabdate: null,
                            issinglepage: false
                        };
                        GrabURLModel.save(obj);
                    }
                }
            }
        }
    });
}

