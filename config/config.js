/**
 *配置文件
 */

var path = require('path');
var config = {
    app_name: '多肉',
    app_description: '多肉',
    app_keywords: '多肉',
    // mongodb 配置
    //db: 'mongodb://snail:123465@ds059938.mongolab.com:59938/upsnail',
    db:'mongodb://127.0.0.1/duorou',
    //db:'mongodb://121.42.161.32:27017/upsnail',
    // redis 配置，默认是本地
    redis_host: '127.0.0.1',
    redis_port: 8888,
    // 程序运行的端口
    port: 18080,
    host: '127.0.0.1',
    // 邮箱配置
    mail_opts: {
        host: 'smtp.126.com',
        port: 25,
        auth: {
            user: 'mspublic@126.com',
            pass: ''
        }
    },
    grab_config:{
        host:'http://www.rou01.com/',
        hostname:'http://www.rou01.com/zixun/',//要抓取的站点名称
        pageid:'',//分页控件的id
        pageclass:'pg',//分页控件的class
        sinlepagepattern:'http://www.rou01.com/zixun/index.php?page=',//分页链接的模式
        haslastpage:true,//分页中是否含有最后一页的页码
        lastpageofa:9,//最后一页对应的a标签所在索引
        imgsavepath:'public/images/imgs/',
        pagelist_page_id:'',
        pagelist_page_class:'.xs2a',
        pagelist_page_a_class:'.xi2',//文章的a标签的class
        article_content_id:'',
        article_content_class:'#article_content',
        article_title_id:'',
        article_title_class:'.ph',
        a_reg:/<a\s*href="(.*?)">/g,
        img_reg:/<img\s*src="data(.*?)">/g,
        global_reg_replace:/".*\//g,
        imgname_reg:/(\w+\.(?:png|jpg|gif|bmp))$/,
    }
};
module.exports = config;
