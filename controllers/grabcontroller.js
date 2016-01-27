var urlctrl = require('./graburlcontroller');
var pagectrl = require('./grabpagecontroller');

//抓取主方法
exports.RunGrab = function () {
    //1.抓取总共页码
    //urlctrl.grabAllPageURL();
    
    //2.抓取每个分页对应的文章列表url
    //pagectrl.grabAllPageOfSingleURL();
    
    //3.抓取文章
    pagectrl.test();
}



