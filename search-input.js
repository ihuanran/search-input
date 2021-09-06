;(function($,window,document) {
    $.fn.searchInput = function (option) {
        var Class = function (input, option) {
            var that;
            var id;
            if ((id = $(input).attr('data-search-input'))) {
                if (!window.searchInputGlobalObject || !window.searchInputGlobalObject[id]) {
                    throw '缺失全局对象:' + id;
                }
                that = window.searchInputGlobalObject[id];
                if (option.data) {
                    that.config.data = option.data;
                    that.data = that.config.packData(that.config.data);
                }
            }
            else {
                that = this;
                that.elem = input;
                that.init.call(that);
            }

            return {
                config: function () {return that.config},
                id: function () {return that.id;},
                setValue: function (value, index) {
                    //value：要设置的值
                    //index：值的索引列，如果为null，则用所有input的索引查找，可能不准确
                    return that.setValue.call(that, value, index);
                }
            };
        }

        //默认配置
        Class.prototype.config = {
            packData: function (data) {return data},//包装数据格式成组件所需格式，[{index1:value1,index2:value2},{index1:value1,index2:value2}]
            data: [],//查找的数据
            index: 0,//主输入框对应的数据索引
            extra: [],//额外输入框，对象数组，每一个对象对应一个输入框，属性包含
            // input:string或jq对象，或null。如果为jq对象将直接使用，请确保选择器存在，并且为input。如果为string，将联合level查找input。如果为null代表这项没有输入框
            // level:'siblings'或'closest::?'，siblings代表和主输入框为兄弟元素，closest::?代表从主输入框向上寻找元素，并从此元素下寻入input，?将做为选择器，即?为主输入框和input共有的父元素
            // index: int或string，数据索引，可为数字索引或字符串索引
            // search: true/false，代表查找时，是否要查找这数据索引值，默认第一个额外输入框为true，其它为false
            // show: true/false，代表在结果下拉框中是否要显示，默认第一个额外输入框为true，其它为false
            showCount: 10,//int，寻找结果最多展示条数
            spaceShowAll: false,//true/false，输入框输入空格是否显示全部
            focusShowAll: false,//true/false，输入框聚焦时是否显示全部
            focusShowAllFilter: true,///true/false，输入框聚焦时显示全部，当输入框有值时，是否按值过滤，为false时将始终显示所有数据
            maxHeight: 200,//int，代表下拉结果框的最大高度
            width: 'auto',//auto或int，代表下拉结果框的宽度，auto将和当前输入框保持一样的宽度
            matchLength: 1,//int，输入值达到几位时开始查找，大数据时可适当增加位数
            container: false,//false或元素选择器字符串，向指定元素追加下拉结果框，为false时会增加在输入框下面
            showMsg: false,//true/false，找不到数据时，显示信息
            msgHide: 2000,//毫秒，显示信息时自动关闭的延时，为0时不关闭
            msg: '未找到此项',//显示信息内容
            empty: null,//function(value, input),匹配不到数据时的回调，value是当前输入框的值，input是当前输入框的jq对象
            theme: 'blue',//主题,'blue','green',''
            done: null,//function(matching,data),组件寻找完成时，赋值后的回调，matching代表寻找成功与否，data代表寻找数据的结果
            placement: 'auto',//下拉结果框的方向,auto,top或bottom，auto时将根据元素上下的窗口剩余高度进行选择
        }

        //初始化
        Class.prototype.init = function(){
            var that = this;

            var globalOption = (window.searchInputGlobalOption && window.searchInputGlobalOption instanceof Object) ? window.searchInputGlobalOption : {};
            that.config = $.extend({}, that.config, globalOption, option);
            that.append = {};
            that.matching = {content:{}, length: 0, selected:-1, open: false};

            that.data = that.config.packData(that.config.data);

            that.generateId.call(that);

            that.inputs = that.getInputGroup.call(that);

            that.inputGroupSetId.call(that);

            that.generateSelector.call(that);

            that.event.call(that);
        }

        //注册事件
        Class.prototype.event = function(){
            var that = this;

            that.focusEvent.call(that);
            that.inputEvent.call(that);
            that.clickLiEvent.call(that);
            that.keydownEvent.call(that);
            that.blurEvent.call(that);
            that.setValueEvent.call(that);
        }

        //输入框聚焦事件
        Class.prototype.focusEvent = function(){
            var that = this;
            var input;

            if (!that.config.focusShowAll) {
                return;
            }

            for (var i = 0;i < that.inputs.length; i++) {
                input = that.inputs[i];
                if (input.elem === null) {
                    continue;
                }

                input.elem.on('focus', function () {
                    $(this).trigger('input');
                });
            }

        }

        //输入框输入事件
        Class.prototype.inputEvent = function(){
            var that = this;
            var input;

            for (var i = 0;i < that.inputs.length; i++) {
                input = that.inputs[i];
                if (input.elem === null) {
                    continue;
                }
                input.elem.on('input', function () {
                    var value = $(this).val();

                    if (!that.config.focusShowAll && value === '') {
                        that.matching.selected = -1;
                        that.assignmentValue.call(that, -1);
                        that.matching.open = false;
                        that.selector.css('display', 'none');
                        return;
                    }

                    if (that.message) {
                        that.message.css('display', 'none');
                        $(this).removeClass('search-input-warning');
                    }

                    if (!that.config.focusShowAll && value.length < that.config.matchLength) {
                        that.matching.open = false;
                        that.selector.css('display', 'none');
                        return;
                    }

                    that.searchValue.call(that, value);
                    that.renderSelector.call(that, this);
                });
            }
        }

        //结果下拉框点击事件
        Class.prototype.clickLiEvent = function(){
            var that = this;

            that.selector.on('click', 'li[data-index]', function () {
                var index = parseInt($(this).attr('data-index'));
                that.matching.selected = index;
                that.assignmentValue.call(that, index);

                $(this).addClass('selected').siblings('li').removeClass('selected');

                that.matching.open = false;
                that.selector.css('display', 'none');
            });
        }

        //结果下拉框存在时，键盘控制事件
        Class.prototype.keydownEvent = function(){
            var that = this;
            var input;

            for (var i = 0;i < that.inputs.length; i++) {
                input = that.inputs[i];
                if (input.elem === null) {
                    continue;
                }
                input.elem.on('keydown', function (event) {
                    var liSelected;
                    var next;
                    var boundary;
                    var nextBorder;
                    var index;

                    if (that.selector.is(':hidden')) {
                        return;
                    }

                    if ([38, 40, 13].indexOf(event.keyCode) === -1) {
                        return;
                    }

                    liSelected = that.selector.find('li[data-index].selected');
                    if (!liSelected) {
                        return;
                    }

                    if (event.keyCode === 38) {
                        next = liSelected.prev('li[data-index]');
                        if (!next.length) {
                            return false;
                        }

                        index = parseInt(next.attr('data-index'));
                        if (index >= 0) {
                            liSelected.removeClass('selected');
                            next.addClass('selected');
                            that.matching.selected = index;
                        }

                        nextBorder = 0;
                        next.prevAll().each(function () {
                            nextBorder += $(this).outerHeight(true);
                        });
                        boundary = nextBorder - that.selector.scrollTop();
                        if (boundary < 0) {
                            that.selector.scrollTop(that.selector.scrollTop() + boundary);
                        }
                        return false;
                    }
                    else if (event.keyCode === 40) {
                        next = liSelected.next('li[data-index]');
                        if (!next.length) {
                            return false;
                        }

                        index = parseInt(next.attr('data-index'));
                        if (index >= 0) {
                            liSelected.removeClass('selected');
                            next.addClass('selected');
                            that.matching.selected = index;
                        }

                        nextBorder = 0;
                        next.prevAll().each(function () {
                            nextBorder += $(this).outerHeight(true);
                        });
                        nextBorder += next.outerHeight(true);
                        boundary = nextBorder - that.selector.height() - that.selector.scrollTop();
                        if (boundary > 0) {
                            that.selector.scrollTop(that.selector.scrollTop() + boundary);
                        }
                        return false;
                    }
                    else if (event.keyCode === 13) {
                        that.assignmentValue.call(that, that.matching.selected);

                        that.matching.open = false;
                        that.selector.css('display', 'none');
                    }
                });
            }
        }

        //输入框失去焦点事件
        Class.prototype.blurEvent = function(){
            var that = this;
            var input;

            for (var i = 0;i < that.inputs.length; i++) {
                input = that.inputs[i];
                if (input.elem === null) {
                    continue;
                }
                input.elem.on('blur', function () {
                    setTimeout(function () {
                        if (!that.matching.open) {
                            return;
                        }

                        that.assignmentValue.call(that, that.matching.selected);

                        that.matching.open = false;
                        that.selector.css('display', 'none');
                    }, 200);
                });
            }
        }

        //输入框触发匹配事件
        Class.prototype.setValueEvent = function(){
            var that = this;
            var input;
            var index;

            for (var i = 0;i < that.inputs.length; i++) {
                input = that.inputs[i];
                index = input.index;
                if (input.elem === null) {
                    continue;
                }
                input.elem.on('search-input.setValue', function () {
                    var value = $(this).val();

                    if (value === '') {
                        return;
                    }

                    for (var j = 0;j < that.inputs.length; j++) {
                        if (this === that.inputs[j].elem[0]) {
                            that.setValue.call(that, value, that.inputs[j].index);
                            break;
                        }
                    }
                });
            }
        }

        //设置输入框的值，并让组件完成查找赋值
        Class.prototype.setValue = function(value, index){
            var that = this;
            var j;
            var hitIndex = null;

            if (value === '') {
                hitIndex = -1;
            } else {
                that.searchValue.call(that, value, index);

                if (!that.matching.length) {
                    return;
                }

                for (j = 0; j < that.matching.content.first.length; j++) {
                    hitIndex = that.matching.content.first[j].index;
                    break;
                }
                if (hitIndex === null) {
                    return;
                }
            }

            that.assignmentValue.call(that, hitIndex, true);

            that.matching.open = false;
            that.selector.css('display', 'none');
        }

        //设置输入框值
        Class.prototype.assignmentValue = function(index, isSetValue){
            var that = this;
            var value;
            var params;

            var data = (index === -1) ? {} : that.objectDeepCopy(that.data[index]);
            params = {};
            params.data = data;
            params.matching = !(index === -1);
            params.isSetValue = !!isSetValue;

            for (var i = 0; i < that.inputs.length; i++) {
                if (that.inputs[i].elem === null) {
                    continue;
                }

                value = data[that.inputs[i].index] ? data[that.inputs[i].index] : '';

                that.inputs[i].elem.val(value);
                params.value = value;
                that.inputs[i].elem.trigger('search-input.change', params);
            }

            if (that.config.done && typeof that.config.done === 'function') {
                that.config.done(params.matching, params.data);
            }
        }

        //查找数据
        Class.prototype.searchValue = function(value, index){
            var that = this;
            var i, j;
            var item;
            var indexs = [];
            var currentIndex;
            var current;
            var hit = [];
            that.matching.content = {
                first: [],//完全匹配
                second: [],//完全匹配(不区分大小写)
                third: [],//开头包含(不区分大小写)
                fourth: [],//包含(不区分大小写)
            };
            that.matching.length = 0;
            value = value.toString();

            if (index === undefined) {
                for (i = 0; i < that.inputs.length; i++) {
                    if (that.inputs[i].search) {
                        indexs.push(that.inputs[i].index);
                    }
                }
            } else {
                indexs.push(index);
            }

            for (i = 0; i < that.data.length; i++) {
                item = that.data[i];
                for (j = 0; j < indexs.length; j++) {
                    currentIndex = indexs[j];

                    if (item[currentIndex] === undefined) {
                        throw '数据第' + i + '项索引[' + currentIndex + ']有误';
                    }

                    current = item[currentIndex].toString();
                    if (that.config.focusShowAll && !that.config.focusShowAllFilter && hit.indexOf(i) < 0) {
                        that.matching.content.fourth.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                    else if (that.config.focusShowAll && value === '' && hit.indexOf(i) < 0) {
                        that.matching.content.fourth.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                    else if (that.config.spaceShowAll && /^[ ]+$/.test(value) && hit.indexOf(i) < 0) {
                        that.matching.content.fourth.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                    else if (value !== '' && current == value && hit.indexOf(i) < 0) {
                        that.matching.content.first.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                    else if (value !== '' && (current == value.toUpperCase() || current == value.toLowerCase()) && hit.indexOf(i) < 0) {
                        that.matching.content.second.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                    else if (value !== '' && (current.indexOf(value) === 0 || current.indexOf(value.toUpperCase()) === 0 || current.indexOf(value.toLowerCase()) === 0) && hit.indexOf(i) < 0) {
                        that.matching.content.third.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                    else if (value !== '' && (current.indexOf(value) >= 0 || current.indexOf(value.toUpperCase()) >= 0 || current.indexOf(value.toLowerCase()) >= 0) && hit.indexOf(i) < 0) {
                        that.matching.content.fourth.push({index: i, value: item});
                        that.matching.length += 1;
                        hit.push(i);
                    }
                }
            }
        }

        //渲染结果选择框
        Class.prototype.renderSelector = function(input){
            var that = this;
            var item = [];
            var li = '';
            var i, j;
            var overflow = false;
            var liClass;
            var inputTop;
            var inputBottom;
            var onTop = false;

            that.selector.children().remove();

            if (that.config.focusShowAll) {
                item.push({index: -1, value: {}});
            }
            for(i in that.matching.content){
                for (j = 0; j < that.matching.content[i].length; j++) {
                    if (!that.config.focusShowAll && !that.config.spaceShowAll && that.config.showCount && item.length > that.config.showCount) {
                        overflow = true
                        break;
                    }
                    item.push(that.matching.content[i][j]);
                }
            }

            if (item.length === 0) {
                that.matching.selected = -1;
                that.matching.open = false;
                that.selector.css('display', 'none');
                if (that.config.showMsg) {
                    that.showMessage.call(that, input, that.config.msg);
                    $(input).addClass('search-input-warning');
                    if (that.config.msgHide) {
                        setTimeout(function () {
                            that.message.fadeOut();
                            $(input).removeClass('search-input-warning');
                        }, that.config.msgHide);
                    }
                }
                if (that.config.empty && typeof that.config.empty === 'function') {
                    that.config.empty($(input).val(), $(input));
                }
                return;
            }

            //判断上下位置大小
            if (that.config.placement == 'auto') {
                inputTop = $(input).offset().top - $(window).scrollTop();
                inputBottom = $(window).height() - inputTop - $(input).outerHeight(true);
                if (inputTop > inputBottom) {
                    item.reverse();
                    onTop = true;
                }
            } else if (that.config.placement == 'top') {
                item.reverse();
                onTop = true;
            }

            for (i = 0; i < item.length; i++) {
                liClass = '';
                if (!onTop && i === 0 && !that.config.focusShowAll) {
                    that.matching.selected = item[i].index;
                    liClass = 'selected';
                } else if (!onTop && i === 1 && that.config.focusShowAll) {
                    that.matching.selected = item[i].index;
                    liClass = 'selected';
                } else if (onTop && i === item.length - 2 && that.config.focusShowAll) {
                    that.matching.selected = item[i].index;
                    liClass = 'selected';
                } else if (onTop && i === item.length - 1 && !that.config.focusShowAll) {
                    that.matching.selected = item[i].index;
                    liClass = 'selected';
                }
                li += '<li class="' + liClass + '" data-index="' + item[i].index + '">';
                for (j = 0; j < that.inputs.length; j++) {
                    if (!that.inputs[j].show) {
                        continue;
                    }

                    li += '<span data-index="' + that.inputs[j].index + '">' + (item[i].index === -1 ? '' : item[i].value[that.inputs[j].index]) + '</span>';
                }
                li += '</li>'
            }
            if (overflow && !onTop) {
                li += '<li data-index="-1"><span>共匹配' + that.matching.length + '项数据</span></li>';
            } else if (overflow && onTop) {
                li = '<li data-index="-1"><span>共匹配' + that.matching.length + '项数据</span></li>' + li;
            }

            that.selector.append(li);

            that.locateSelector.call(that, input);
            if (onTop && that.config.container === false) {
                that.selector.css("top", ($(input).position().top - that.selector.outerHeight(true)) + "px");
            } else if (onTop) {
                that.selector.css("top", ($(input).offset().top - $(window).scrollTop() - that.selector.outerHeight(true)) + "px");
            }

            that.matching.open = true;
            that.selector.css('display', 'block');
            if (onTop) {
                that.selector.scrollTop(that.selector[0].scrollHeight);
            } else {
                that.selector.scrollTop(0);
            }
        }

        //生成组件ID
        Class.prototype.generateId = function(){
            var that = this;

            that.id = that.randomString();
            if (window.searchInputGlobalObject === undefined) {
                window.searchInputGlobalObject = {};
            }
            window.searchInputGlobalObject[that.id] = that;
        }

        //初始化结果选择框
        Class.prototype.generateSelector = function(){
            var that = this;

            var theme = that.config.theme;

            that.selector = $('<ul class="search-input-matching ' + theme + '" id="search-input-' + that.id + '"></ul>');
        }

        //定位结果选择框
        Class.prototype.locateSelector = function(input){
            var that = this;
            var offset;

            //附加到文档html上
            if (!that.append.selector) {
                if (that.config.container === false) {
                    $(input).after(that.selector);
                } else {
                    $(that.config.container).append(that.selector);
                }
                that.append.selector = true;
            }

            //最大高度
            if (that.config.maxHeight) {
                that.selector.css('max-height', that.config.maxHeight);
            }

            //宽度
            if (that.config.width == 'auto') {
                that.selector.width($(input).innerWidth());
            } else {
                that.selector.width(that.config.width);
            }

            //定位
            if (that.config.container === false) {
                that.selector.css("left", $(input).position().left + "px");
                that.selector.css("top", ($(input).position().top + $(input).outerHeight(true)) + "px");
            } else {
                offset = $(input).offset();
                that.selector.css('position', 'fixed');
                that.selector.css("left", (offset.left - $(window).scrollLeft()) + "px");
                that.selector.css("top", (offset.top - $(window).scrollTop() + $(input).outerHeight(true)) + "px");
            }
        }

        //显示消息
        Class.prototype.showMessage = function(input, msg){
            var that = this;

            that.generateMessage.call(that);
            that.message.find('p').text(msg);
            that.locateMessage.call(that, input);
            that.message.css('display', 'block');
        }

        //定位消息框
        Class.prototype.locateMessage = function(input){
            var that = this;
            var offset;

            //附加到文档html上
            if (!that.append.message) {
                if (that.config.container === false) {
                    $(input).after(that.message);
                } else {
                    $(that.config.container).append(that.message);
                }
                that.append.message = true;
            }

            //宽度
            that.message.css('max-width', $(input).innerWidth());

            //定位
            if (that.config.container === false) {
                that.message.css("left", $(input).position().left + "px");
                that.message.css("top", ($(input).position().top - that.message.height()) + "px");
            } else {
                offset = $(input).offset();
                that.message.css('position', 'fixed');
                that.message.css("left", (offset.left - $(window).scrollLeft()) + "px");
                that.message.css("top", (offset.top - $(window).scrollTop() - that.message.height()) + "px");
            }
        }

        //初始化消息框
        Class.prototype.generateMessage = function(){
            var that = this;

            if (!that.message) {
                that.message = $('<div class="search-input-message" id="search-input-message-' + that.id + '">' +
                    '<div><p></p><span></span></div>' +
                    '</div>');
            }
        }

        //获取所有输入框
        Class.prototype.getInputGroup = function(){
            var that = this;
            var config;
            var inputs = [];
            var input;
            var level;

            inputs.push({
                elem: $(that.elem),
                index: that.config.index,
                search: true,
                show: true,
            });

            for (var i = 0;i < that.config.extra.length; i++) {
                config = that.getConfigExtraItem.call(that, i, that.config.extra[i]);

                if (config.input === null) {
                    input = null;
                }
                else if (config.input instanceof jQuery && config.input.length) {
                    input = config.input;
                }
                else if (config.level === 'siblings') {
                    input = $(that.elem).siblings(config.input);
                    if (input.length < 1) {
                        throw '找不到extra第' + (i + 1) + '项input';
                    }
                }
                else if ((level = config.level.split('::')) && level.length === 2 && level[0] === 'closest') {
                    input = $(that.elem).closest(level[1]).find(config.input);
                    if (input.length < 1) {
                        throw '找不到extra第' + (i + 1) + '项input';
                    }
                } else {
                    throw 'extra第' + (i + 1) + '项input配置错误';
                }

                inputs.push({
                    elem: input,
                    index: config.index,
                    search: config.search,
                    show: config.show,
                });
            }

            return inputs;
        }

        //输入框赋值ID
        Class.prototype.inputGroupSetId = function(){
            var that = this;
            var input;

            for (var i = 0;i < that.inputs.length; i++) {
                input = that.inputs[i];
                if (input.elem === null) {
                    continue;
                }

                input.elem.attr('data-search-input', that.id);
            }
        }

        //生成随机字符串
        Class.prototype.randomString = function(){
            return Number(Math.random().toString().substr(3,6) + Date.now()).toString(36);
        };

        //深拷贝对象
        Class.prototype.objectDeepCopy = function(object){
            if (!(object instanceof Object)) {
                return object;
            }
            return JSON.parse(JSON.stringify(object));
        };

        //extra各项的默认配置
        Class.prototype.getConfigExtraItem = function(index, item){
            var that = this;

            if (typeof item !== 'object') {
                throw 'extra第' + (index + 1) + '项input配置错误';
            }
            return $.extend({}, {input:null, level:'siblings', index: index, search: (index === 0), show: (index === 0)}, item);
        };

        return new Class(this, option);
    }
})(jQuery,window,document);