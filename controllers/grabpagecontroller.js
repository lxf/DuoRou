var cheerio = require('cheerio');
var request = require('request');
var http = require('http');
var BufferHelper = require('bufferhelper');
var iconv = require('iconv-lite');

var _ = require("underscore")._;
var async = require('async');

var fs = require('fs');
var path = require('path');
var config = require('../config/config');

var ArticleModel = require('../models/articlemodel');
var URLModel = require('../models/URLModel');
var SaveImgCtrl = require('./saveimgcontroller');

//抓取单篇文章table.vwtb 中的第一个div，下载图片
exports.grabAllPageOfSingleURL = function (req, res, next) {
    //1.获取所有的待抓取的任务
    URLModel.getData({ 'isgrabed': false }, {}, function (err, result) {
        var tograburllist = result;
        _.each(result, function (ele, index, list) {
            grabSinglePageUrl(ele.graburl);
        });
    });
}

exports.test = function () {
    grabSinglePage('http://www.rou01.com/article-1003-1.html');
}

//抓取一个文章列表页面上的所有文章url
function grabSinglePageUrl(url) {
    request.get(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            $(config.grab_config.pagelist_page_class).children(config.grab_config.pagelist_page_a_class).map(function (index, ele) {
                var href = $(this).attr('href');
                console.log(href);
                var obj = {
                    graburl: href,
                    isgrabed: false,
                    lastgrabdate: null,
                    issinglepage: false,
                    level: 2
                };
                URLModel.save(obj);
            });

        }
    });
}

//抓取某篇具体文章内容
function grabSinglePage(url) {

    fetchContent(url, function (result) {
        var $ = cheerio.load(result);
        var title = $(config.grab_config.article_title_class).eq(0).text();
        var content = $(config.grab_config.article_content_class).html();
        //找出所有img,并且下载
        var res = [],//储存该页面所有图片
            match;

        while ((match = config.grab_config.img_reg.exec(content)) != null) {
            res.push(match[1]);
            var url = config.grab_config.host + match[1];
            var filename = config.grab_config.imgname_reg.exec(url)[0];
            SaveImgCtrl.saveImgToLocal(match[1], config.grab_config.imgsavepath, filename);
        }
            
        //替换路径
        if (res.length > 0) {
            var filter = res[0].substring(0, res[0].lastIndexOf('/') + 1);
            content = content.replace(new RegExp(filter, 'gi'), '../imgs/');
        }
            
        //过滤一些脚本
            
        //存储
        var article = { title: title, content: content, createdate: new Date() };
        ArticleModel.save(article);
    });
}

//返回内容
function fetchContent(url, calback) {
    var req = request(url, { timeout: 10000, pool: false });
    req.setMaxListeners(50);
    
    // req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    //     .setHeader('accept', 'text/html,application/xhtml+xml');

    req.on('error', function (err) {
        console.log(err);
    });

    req.on('response', function (res) {
        var bufferHelper = new BufferHelper();
        res.on('data', function (chunk) {
            bufferHelper.concat(chunk);
        });
        res.on('end', function () {
            var result = iconv.decode(bufferHelper.toBuffer(), 'GBK');
            calback(result);
        });
    });
}