var urlctrl = require('./graburlcontroller');
var pagectrl = require('./grabpagecontroller');

//抓取主方法
exports.RunGrab = function () {
    pagectrl.test();
    // pagectrl.grabAllPageOfSingleU    RL(req,res,next);
}