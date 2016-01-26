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
var urllist = [];
var indexurl = 0;
//抓取单篇文章table.vwtb 中的第一个div，下载图片
exports.grabAllPageOfSingleURL = function (req, res, next) {
    //1.获取所有的待抓取的任务
    URLModel.getData({ 'isgrabed': false }, {}, function (err, result) {
        _.each(result, function (ele, index, list) {
            grabSinglePageUrl(ele.graburl);
        });
    });
}

exports.test = function () {
    urllist.push('http://www.rou01.com/article-873-1.html');
    urllist.push('http://www.rou01.com/article-720-1.html');
    grabSinglePage(urllist[indexurl]);

    // async.waterfall([
    //     function (callback) {
    //         URLModel.getData({ 'level': 2 }, {}, function (err, result) {
    //             _.each(result, function (ele, index, list) {
    //                 urllist.push(ele.graburl);
    //             });
    //             setTimeout(function () {
    //                 callback(null, urllist);
    //             }, 1000);
    //         });
    //     },
    //     function (data, callback) {
    //         writeLog(urllist.toString());
    //         grabSinglePage(urllist[indexurl]);
    //     }
    // ], function (err, data) {
    //     console.log('******异步这边爆错*******:' + err)
    // });
}

//抓取某篇具体文章内容
function grabSinglePage(url) {
    fetchContent(url, function (result) {        
        //cheerio默认是转换实体字符集的
        var $ = cheerio.load(result, { decodeEntities: false });
        var title = $(config.grab_config.article_title_class).eq(0).text();
        var content = $(config.grab_config.article_content_class).html();
        //找出所有img,并且下载
        var res = [],//储存该页面所有图片
            match;
            
        //并行执行
        async.parallel({
            downImg: function (done) {
                while ((match = config.grab_config.img_reg.exec(content)) != null) {
                    res.push(match[1]);
                    var url = config.grab_config.host + match[1];

                    var filenamematch = config.grab_config.imgname_reg.exec(url);

                    if (filenamematch != null && filenamematch.length > 0) {
                        SaveImgCtrl.saveImgToLocal(match[1], config.grab_config.imgsavepath, filenamematch[0]);
                    }
                }
                console.log('图片下载完成!');
                done(null, null);
            },
            saveContent: function (done) {
                //替换路径
                if (res.length > 0) {
                    var filter = res[0].substring(0, res[0].lastIndexOf('/') + 1);
                    content = content.replace(new RegExp(filter, 'gi'), '../imgs/');
                }
            
                //过滤一些脚本
                //windows下"会变成\"
                // content = content.replace(new RegExp('\\"'), '"');
                if (content != '' && content != null) {
                    content = content.replace(new RegExp('<p><font size="2px">[\\w\\W]*'), '');
                }
              
                //存储
                var article = { title: title, content: content, createdate: new Date() };

                ArticleModel.save(article, function (result) {
                    //更新抓取链接的状态
                    URLModel.partialUpdate(url, function (res) {
                        console.log(res);
                        console.log('保存及更新状态成功!');
                    })
                });
                done(null, null);
            }
        }, function (error, result) {
            indexurl++;
            grabSinglePage(urllist[indexurl]);
        });
    });
}

//返回内容
function fetchContent(url, calback) {
    if (url != undefined) {
        console.log('进行下一次----->当前任务号:' + indexurl + ",总任务数:" + urllist.length + ",链接:" + url);
        writeLog(url);
        var req = request(url, { timeout: 10000, pool: false });
        req.setMaxListeners(50);
    
        // req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
        //     .setHeader('accept', 'text/html,application/xhtml+xml');
       
        req.on('response', function (res) {
            var bufferHelper = new BufferHelper();
            res.on('data', function (chunk) {
                bufferHelper.concat(chunk);
            });

            res.on('end', function () {
                var result = iconv.decode(bufferHelper.toBuffer(), 'GBK');
                calback(result);
            });

            res.on('error', function (err) {
                console.log('返回结果错误:' + err);
            });
        });

        process.nextTick(function () {
            req.on('error', function (err) {
                console.log('*******请求出错*******:' + err + ',链接:' + url);
            });
        });
    }
}


//抓取一个文章列表页面上的所有文章url
function grabSinglePageUrl(url) {
    request.get(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            $(config.grab_config.pagelist_page_class).children(config.grab_config.pagelist_page_a_class).map(function (index, ele) {
                var href = $(this).attr('href');
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

function writeLog(content) {
    fs.appendFile(path.join(__dirname, 'log.txt'), content + "\n\r", 'utf8', function (err) {
        if (err) throw err;
    });
}