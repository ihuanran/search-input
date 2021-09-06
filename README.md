# Search Input 文档

## 使用方法

引入`search-input.css`和`search-input.js`即可。

---

## 快速使用

```js
    <div>
        <input name="name" placeholder="输入框1(名称)">
        <input name="code" placeholder="输入框2(代码)">
    </div>

    $('[name=name]').searchInput({
        data: [
            {"name":"中国","code":"142"},
            {"name":"美国","code":"502"},
        ],
        index：'name',
        extra: [
            {input:'[name=code]', index:'code'}
        ],
    });
```

将在输入框进行输入时，根据输入值生成下拉匹配框供查看选择

## 基础参数

searchInput方法里是一个包含参数 `option` 的对象，下面将逐一讲解 `option`

---

- **data**

解释：组件进行查找的数据来源

类型：array，为对象数组或二维数组，第一维数组为数据长度，第二维数组为每一项的数据内容，可为对象，如`{"name":"中国","code":"142"}`，也可为数组`["中国","142"]`

是否必填：必填

---

- **packData**

解释：当源数据不符合组件要求时，可设置这函数对源数据进行包装，使之符合组件要求

类型：function，传入`data`源数据，函数必须返回包装后的新数据

是否必填：非必填

---

- **index**

解释：主输入框（也就是渲染组件的input）对应的数据索引

类型：int/string，对应索引，如`{"name":"中国","code":"142"}`则是`name`，`["中国","142"]`则是`0`

是否必填：必填

---

- **extra**

解释：额外输入框，对象数组，每一个对象对应一个输入框，属性包含如下

- `input`：string或jq对象。如果为`jq对象`将直接使用，请确保选择器存在，并且为`input`。如果为`string`，将联合`level`查找input。不设置或者为null代表这项没有输入框，非必填，默认`null`

- `level`：`siblings`或`closest::?`，`siblings`代表和主输入框为`兄弟元素`，`closest::?`代表从主输入框向上寻找元素，并从此元素下寻入`input`，?将做为选择器，即?为主输入框和input共有的`父元素`，非必填，默认`siblings`

- `index`：`int`或`string`，数据索引，可为数字索引或字符串索引，必填

- `search`: `true/false`，代表查找时，是否要查找这数据索引的值。非必填，默认`第一个`额外输入框为true，其它为false

- `show`: `true/false`，代表在结果下拉框中是否要显示。非必填，默认`第一个`额外输入框为true，其它为false

---

- **showCount**

解释：寻找结果最多展示条数

类型：int，设置`0`时代表全部展示

是否必填：非必填，默认为10

---

- **spaceShowAll**

解释：输入框输入空格是否显示全部

类型：`true/false`，此设置会覆盖`showCount`

是否必填：非必填，默认false

---

- **focusShowAll**

解释：输入框聚焦时是否显示全部

类型：`true/false`，此设置会覆盖`showCount`

是否必填：非必填，默认false

---

- **focusShowAllFilter**

解释：输入框聚焦时显示全部，当输入框有值时，是否按值过滤，为false时将始终显示所有数据

类型：`true/false`

是否必填：非必填，默认false

---

- **maxHeight**

解释：下拉结果框的最大高度

类型：`int`

是否必填：非必填，默认200px

---

- **width**

解释：下拉结果框的宽度

类型：`auto或int`，auto将和当前输入框保持一样的宽度

是否必填：非必填，默认auto

---

- **matchLength**

解释：输入值达到几位时开始查找

类型：`int`，大数据时可适当增加位数

是否必填：非必填，默认1

---

- **container**

解释：向指定元素追加下拉结果框

类型：false或元素选择器字符串，为false时会增加在输入框下面

是否必填：非必填，默认false

---

- **showMsg**

解释：找不到数据时，显示信息

类型：true/false

是否必填：非必填，默认false

---

- **msgHide**

解释：显示信息时自动关闭的延时

类型：int，毫秒，为0时不关闭

是否必填：非必填，默认2000

---

- **msg**

解释：显示信息内容

类型：string

是否必填：非必填，默认`未找到此项`

---

- **empty**

解释：匹配不到数据时的回调

类型：function(value, input)，value是当前输入框的值，input是当前输入框的jq对象

是否必填：非必填

---

- **theme**

解释：主题

类型：目前有'blue','green'和''，可选

是否必填：非必填，默认`blue`

---

- **done**

解释：组件寻找完成时，`赋值后`的回调

类型：function(matching,data)，matching代表寻找成功与否，data代表寻找数据的结果

是否必填：非必填

---

- **placement**

解释：下拉结果框的方向

类型：`auto,top或bottom`，auto时将根据元素上下的窗口剩余高度进行选择

是否必填：非必填，默认`auto`

---

## 全局配置

组件使用了`window.searchInputGlobalOption`，作为全局配置，可在调用组件之前定义此变量，来使当前页面使用此全局配置

```js
    window.searchInputGlobalOption = {
        theme: 'green'
    };
```

## 事件

### search-input.change

组件每次匹配，并且赋值输入框`input`成功后，将会在每个`input`触发事件`search-input.change`，可监听输入框的此事件，进行逻辑操作

```js

    <div>
        <input name="name" placeholder="输入框1(名称)">
        <input name="code" placeholder="输入框2(代码)">
    </div>

    $('[name=name]').searchInput({
        data: [
            {"name":"中国","code":"142"},
            {"name":"美国","code":"502"},
        ],
        index：'name',
        extra: [
            {input:'[name=code]', index:'code'}
        ],
    });

    $('[name=name]').on('search-input.change', function(e, params) {
        //params结构如下
        {
            matching: true,//是否匹配数据成功
            value: '中国',//当前输入框的赋值
            data: {"name":"中国","code":"142"},//当前匹配到的所有数据项
            isSetValue: false,//是否是由'setValue'方法/事件赋值时触发此事件，可解决一些循环调用的逻辑
        }
    });
```

---

### search-input.setValue

组件所有input框都会监听`search-input.setValue`事件，当触发这个事件时，会取触发此事件的input框的值，和此input对应的索引，进行查找，并自动赋值所有input框

注意，查找后使用结果时，只会使用`完全匹配`的`第一个`结果

```js

    <div>
        <input name="name" placeholder="输入框1(名称)">
        <input name="code" placeholder="输入框2(代码)">
    </div>

    $('[name=name]').searchInput({
        data: [
            {"name":"中国","code":"142"},
            {"name":"美国","code":"502"},
        ],
        index：'name',
        extra: [
            {input:'[name=code]', index:'code'}
        ],
    });

    $('[name=code]').val('142').trigger('search-input.setValue');

    setTimeout(function() {
        console.log($('[name=name]').val());//中国
        console.log($('[name=code]').val());//142
    }, 500);
```

## 对象方法

```js
var inputObject = $('[name=name]').searchInput({});
```

上面调用渲染组件的方法后，会返回一个当前组件对象，对象里有很多可以调用的方法，如获取当前组件对象id等，下面一一讲解

---

- **inputObject.config()**

此方法返回当前配置config，需要注意的是，返回是config对象的引用，修改返回值config，也会同步到组件内的config

---

- **inputObject.id()**

此方法返回当前组件对象id，id是每个渲染对象的唯一标识，也用于渲染元素的类名。

---

- **inputObject.setValue(value, index)**

此方法可向组件指定一个值，然后让组件使用此值进行查找，并自动赋值所有input框

value：要设置的值

index：值的索引列，如果不传此参数，则用所有input涉及的索引查找，可能不准确

注意，查找后使用结果时，只会使用`完全匹配`的`第一个`结果

---

最后更新于`2020-08-19`