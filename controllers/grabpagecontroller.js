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
var cur_reconnect_time = 0;//connect timeout,retry times
var reconnect_time = config.reconnect_time;
var options = {
    method: 'GET',
    url: '',
    headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
    },
    timeout: 10000,
};

exports.showData = function (req, res, next) {
    if (req.body.limitnum != undefined) {
        var options = { skip: 0, limit: req.body.limitnum, sort: { 'createdate': -1 } };
        ArticleModel.getData({}, options, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result);
        });
    }
}

exports.showIndex = function (req, res, next) {
    res.render('index');
}

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
    // urllist.push('http://www.rou01.com/article-873-1.html');
    // urllist.push('http://www.rou01.com/article-720-1.html');
    // grabSinglePage(urllist[indexurl]);
    try {

        if (urllist.length != 0) {
            console.log('******【上一次任务还未结束,本次不执行】******');
            return;
        }

        async.waterfall([
            function (callback) {
                URLModel.getData({ 'level': 2 }, { limit: 30 }, function (err, result) {
                    _.each(result, function (ele, index, list) {
                        urllist.push(ele.graburl);
                    });
                    setTimeout(function () {
                        callback(null, urllist);
                    }, 1000);
                });
            },
            function (data, callback) {
                grabSinglePage(urllist[indexurl]);
            }
        ], function (err, data) {
            console.log('******【async.waterfall】******:' + err)
        });
    }
    catch (e) {
        console.log('******【ERROR】******:' + e);
        writeLog('******【ERROR】******:' + e);
    }
}

//抓取某篇具体文章内容
function grabSinglePage(url) {
    fetchContent(url, function (result) {        
        //cheerio默认是转换成实体字符集的
        var $ = cheerio.load(result, { decodeEntities: false });
        var title = $(config.grab_config.article_title_class).eq(0).text();
        var content = $(config.grab_config.article_content_class).html();
        //找出所有img,并且下载
        var res = [],//储存该页面所有图片
            calls = [],
            match;

        async.series([
            function (callback) {
                calls = [];
                res = [];
                while ((match = config.grab_config.img_reg.exec(content)) != null) {
                    res.push(match[1]);
                    var filename = match[1].substring(match[1].lastIndexOf('/') + 1);
                    calls.push(
                        SaveImgCtrl.saveImgToLocal(match[1], config.grab_config.imgsavepath, filename, function (err, msg) {
                            callback(err, msg);
                        }));
                }

                async.parallel(calls, function (err, results) {
                    if (err) {
                        console.log('******【ERROR】******' + err);
                        callback(err, null);
                    }
                    else {
                        console.log('******【SUCCESS】******' + results);
                        callback(null, results);
                    }
                });
            },
            function (callback) {
                if (res.length > 0) {
                    res[0] = 'data' + res[0];
                    var filter = res[0].substring(0, res[0].lastIndexOf('/') + 1);
                    content = content.replace(new RegExp(filter, 'gi'), 'public/imgs/');
                }
                                    
                //过滤一些脚本
                if (content != '' && content != null) {
                    content = content.replace(new RegExp('<p><font size="2px">[\\w\\W]*'), '');
                }
                                      
                //存储
                var article = { title: title, content: content, createdate: new Date() };

                ArticleModel.save(article, function (result) {
                    //更新抓取链接的状态
                    URLModel.partialUpdate(url, function (err, res) {
                        if (err) {
                            callback(err, null);
                        }
                        else {
                            console.log('******【保存及更新状态成功】******');
                            callback(null, res);
                        }
                    })
                });
            },
        ], function (error, results) {
            //这边有点问题
            if (error) {
                console.log('******【链接下载失败】【失败原因:' + error + '】******');
            }
            else {
                //这边不对，一直不停止
                indexurl++;
                console.log('******[indexurl:' + indexurl + ']******');
                if (urllist.length < indexurl) {
                    console.log('******【任务全部完成】******');
                }
                else {
                    grabSinglePage(urllist[indexurl]);
                }
            }

        });

        /* 之前的写法
              async.parallel({
                  downImg: function (done) {
                      calls = [];
                      res = [];
                      while ((match = config.grab_config.img_reg.exec(content)) != null) {
                          res.push(match[1]);
                          var filename = match[1].substring(match[1].lastIndexOf('/') + 1);
                          calls.push(
                              // setTimeout(function () {
                                  SaveImgCtrl.saveImgToLocal(match[1], config.grab_config.imgsavepath, filename, function (msg) {
                                      console.log(msg);
                                  // }, 100);
                              }));
                      }
      
                      async.parallel(calls, function (err, results) {
                          if (err) {
                              console.log('error');
                          }
                          else {
                              console.log('finish');
                          }
                      });
      
                      done(null, null);
                  },
                  saveContent: function (done) {
                      //替换路径
                      if (res.length > 0) {
                          res[0] = 'data' + res[0];
                          var filter = res[0].substring(0, res[0].lastIndexOf('/') + 1);
                          content = content.replace(new RegExp(filter, 'gi'), 'public/imgs/');
                      }
                          
                      //过滤一些脚本
                      if (content != '' && content != null) {
                          content = content.replace(new RegExp('<p><font size="2px">[\\w\\W]*'), '');
                      }
                            
                      //存储
                      var article = { title: title, content: content, createdate: new Date() };
      
                      ArticleModel.save(article, function (result) {
                          //更新抓取链接的状态
                          URLModel.partialUpdate(url, function (res) {
                              //为什么会连续显示以下这句呢
                              console.log('保存及更新状态成功!');
                          })
                      });
      
                      done(null, null);
                  }
              }, function (error, result) {
                  //sleep
                  reconnect_time = 0;
                  indexurl++;
                  if (urllist.length == indexurl) {
                      console.log('任务完成!');
                  }
                  else {
                      grabSinglePage(urllist[indexurl]);
                  }
              });
              */
    });

}

//返回内容
function fetchContent(url, callback) {
    if (url != undefined) {
        console.log((cur_reconnect_time != 0 ? ('[' + cur_reconnect_time + ']') : '') + '----->当前任务号:' + indexurl + ",总任务数:" + urllist.length + ",链接:" + url);

        var bufferHelper = new BufferHelper();
        options.url = url;
        request(options, function (error, response, body) {

        }).on('data', function (chunk) {
            bufferHelper.concat(chunk);
        }).on('end', function () {
            if (cur_reconnect_time > 0) {
                console.log('******【第[' + (3 - reconnect_time) + ']次重连SUCCESS】******');
            }
            cur_reconnect_time = 0;
            var result = iconv.decode(bufferHelper.toBuffer(), 'GBK');
            callback(result);
        }).on('error', function (err) {
            if (err.code == 'ETIMEDOUT') {
                console.log('******【读取数据超时】******');
                writeLog(err);
            }
            else {
                writeLog(err);
                console.log('******【连接出错】******:' + err);
            }

            if (cur_reconnect_time < reconnect_time) {
                //准备重连    
                cur_reconnect_time++;
                console.log('******【正在进行第[' + cur_reconnect_time + ']次重连】******');
                //sleep some time
                sleep(cur_reconnect_time);
                fetchContent(url, callback);
            }
            else {
                console.log('******【尝试重新连接失败】******');
            }
        });
    }

    /**Method 2 
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
                    if (err.code == 'ETIMEDOUT') {
                        console.log('连接超时!');
                    }
                    else {
                        console.log('*******连接出错*******:' + err + ',链接:' + url);
                    }
                });
            });
        }
        **/
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

function sleep(interval) {
    var stop = new Date().getTime();
    var str = '进程休眠:' + interval + '秒开始' + new Date();
    console.log(str);
    writeLog(str)
    while (new Date().getTime() < stop + 1000 * interval) {
        ;
    }
    str = '进程休眠:' + interval + '秒结束' + new Date();
    console.log(str);
    writeLog(str)
}
