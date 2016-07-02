// +----------------------------------------------------------------------
// | CmsWing [ 网站内容管理框架 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2015 http://www.cmswing.com All rights reserved.
// +----------------------------------------------------------------------
// | Author: arterli <arterli@qq.com>
// +----------------------------------------------------------------------
'use strict';

import Base from './base.js';
import API from 'wechat-api';
import http from 'http';
import fs from 'fs';
export default class extends Base {
    /**
    * index action
    * @return {Promise} []1212
    */
    init(http) {
        super.init(http);
    }
    /**
     * index action
     * @return {Promise} []
     */
   
    indexAction() {
        //auto render template file index_index.html
        this.meta_title = '微信管理';
        this.assign({"navxs": true,"bg": "bg-black"});
        return this.display();
    }
    /**
     * 公众账号管理
     */
    async setingAction() {
        let map = { 'status': ['>', -1] }
        if (!this.is_admin()) {//管理员可以管理全部公共账号
            map.uid = this.user.uid;
        }
        let data = await this.model('member_public').where(map).page(this.get('page')).countSelect();
        let Pages = think.adapter("pages", "page"); //加载名为 dot 的 Template Adapter
        let pages = new Pages(); //实例化 Adapter
        let page = pages.pages(data);
        this.assign('pagerData', page); //分页展示使用
        this.assign('list', data.data);
        for(let val of data.data){
            val.uid = await this.model('member').get_nickname(val.uid);
        }
        this.assign({"navxs": true});
        this.meta_title = "公共账号管理";
        return this.display();
    }

    /**
     *新增公众账号
     */
    async addsetingAction(){
        if(this.isPost()){
            let data = this.post();
            let res = await this.model('member_public').add(data);
            if(res){
                return this.success({name: "添加成功", url: "/admin/mpbase/seting"});
            }else{
                return this.fail("添加失败");
            }
        }else{

            this.assign({"navxs": true});
            this.meta_title = "新增公众账号";
            return this.display();
        }
    }

    /**
     *编辑公众账号
     */
    async editsetingAction(){
        if(this.isPost()){
            let data = {};
            let id = this.post("id");
            data.uid = this.post('uid');
            data.public_id = this.post('public_id');
            data.wechat = this.post('wechat');
            data.type = this.post('type');
            data.appid = this.post('appid');
            data.secret = this.post('secret');
            data.encodingaeskey = this.post('encodingaeskey');
            data.mchid = this.post('mchid');
            data.mchkey = this.post('mchkey');
            data.notify_url = this.post('notify_url');
            let res = await this.model("member_public").where({'id':id}).update(data);
            if(res){
                return this.success({name: "编辑成功", url: "/admin/mpbase/seting"});
            }else{
                return this.fail("编辑失败");
            }
        }else{
            let id = this.get("id");
            if (think.isEmpty(id)) {
                this.fail('参数不能为空！');
            }
            let data = await this.model('member_public').where({'id':id}).find();
            this.assign('info',data);
            this.assign({"navxs": true});
            this.meta_title = "编辑公众账号";
            return this.display();
        }
    }
    /**
     *删除公众账号
     */
    async delsetingAction(){
        let id = this.get("ids");
        let res = await this.model('member_public').where({'id':id}).delete();
        if(res){
            return this.success({name: "删除成功", url: "/admin/mpbase/seting"});
        }else{
            return this.fail("删除失败");
        }
    }
    
     async huifuAction(){
        if(this.isPost()){
            let post = this.post();
             if(think.isEmpty(post)){
                post =  JSON.stringify(post)
                 //console.log(post);
                 this.success({name:post,url:"/admin/mpbase"});
             }else{
                 this.fail("dffdsfs");
             }
        }else{
       
         this.meta_title="自动回复";
         this.assign({"navxs": true,"bg": "bg-dark"});
         return this.display();
         }
        }
    /**
     * 设置一条或者多条数据的状态
     */
    async setstatusAction() {
        await super.setstatusAction(this,'member_public');
    }
    
    
     /**
     * 群发功能
     */
     async massAction(){
        this.meta_title="群发功能";
         let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        //let api = new API('wxec8fffd0880eefbe', 'a084f19ebb6cc5dddd2988106e739a07');
        let self = this;
        //调用用户分组API
        let aa = function(api){
            let deferred = think.defer();
            api.getGroups((err,result)=>{
                if(!think.isEmpty(result)){
                    deferred.resolve(result['groups']);
                }else{
                    console.error(err);
                }
            });
            return deferred.promise;
        }
            let res =await aa(api);
        this.assign('groups', res);//用户分组
        this.assign({"navxs": true});
        return self.display();
    }

    /**
     * 微信自定义菜单管理页面
     */
    async selfmenuAction(){

        this.meta_title = "自定义菜单";
        let menu_model = this.model('wx_menu');
        let data = await menu_model.select();
        let self = this;
        let  menu = {
                "menu": {
                    "button": []
                }
            };
        let str =  JSON.stringify(menu);
        this.assign('menu',str);
        return self.display();
    }

    /**
     * 微信端生成自定义菜单
     */
    async setupselfmenuAction(){
        let menu_model = this.model('wx_menu');
        let data = await menu_model.select();
        let menu = buildselfmenu(data);

        let info = function(api){
            let deferred = think.defer();
            api.createMenu(menu,(err,result)=>{
                if(!think.isEmpty(result)){
                    deferred.resolve(result);
                }else{
                    Console.error('err'+err)
                }
            });
            return deferred.promise;
        }
        let res =await info(api);
        if(res.errmsg == 'ok'){
             return this.json('ok');
        }else{
            return this.json('no');
        }
    }

    /**
     * 添加微信自定义菜单
     */
    async addselfmenuAction(){

        let m_id = this.post("id");
        let name = this.post("name");
        let sort = this.post('sort');
        let pid = this.post('pid');
        let type = this.post('type');
        let url = this.post('url');
        let web_token = '';
        let media_id = this.post('media_id');
        let menu_model =this.model("wx_menu");

        let data = {
                        "m_id":m_id,
                        "name":name,
                        "sort":sort,
                        "pid":pid,
                        "type":type,
                        "web_token":web_token,
                        "media_id":media_id,
                        "url":url
                    };
        let res = await menu_model.add(data);
        if(res){
            return this.json("1");
        }else{
            return this.json("2");
        }
    }

    /**
     * 删除微信自定义菜单
     */
    async delselfmenuAction(){

        let m_id = this.post('m_id');
        let pid = this.post('pid');
        console.log(m_id);
        console.log(pid);
        let menu_model =this.model("wx_menu");
        let res = await menu_model.where({m_id: ["=", m_id]}).delete();
        if(res){
            if(m_id) {
                let cmenus = await menu_model.where({pid: ["=", m_id]}).select();
                let ure = "";
                for (var x = 0; x < cmenus.length; x++) {
                    ure = await menu_model.where({id: ["=", cmenus[x].id]}).update({"sort": (x + 1)});
                }

                if (res) {
                    return this.json("1");
                } else {
                    console.log("mawt");
                    return this.json("2");
                }
            }
            //}else{
            //    let fmenus = await menu_model.where({pid:["=",0]}).select();
            //    let ures = "";
            //    for(var x=0;x<fmenus.length;x++){
            //        ures =  await menu_model.where({id:["=",fmenus[x].id]}).update({"sort":(x+1)});
            //    }
            //    if(res && ures){
            //        return this.json("1");
            //    }else{
            //        return this.json("2");
            //    }
            //}
        }else{
            return this.json("2");
        }
    }

    /**
     * 监听微信关注或取消，进行本地用户数据更新
     */
    async updateusersAction(){
        let FromUserName = 'openid';//发送方帐号（一个OpenID）
        let Event = 'subscribe';//subscribe(订阅)、unsubscribe(取消订阅)
        let user_model = this.model('wx_user');
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        if(Event == 'subscribe' && !thik.isEmpty(FromUserName)){
            //通过openid获取用户基本信息
             let userinfo = function(api) {
                    let deferinfo = think.defer();
                    api.getUser(FromUserName,(err,result)=>{
                        if(!think.isEmpty(result)){
                        deferinfo.resolve(result);
                        }else{
                            Console.error('err'+err);
                        } 
                    });
                    return deferinfo.promise;
             }
             let resusers = await userinfo(api);
             //添加到本地库中
             await user_model.add(resusers);            
        }else{
            //修改取消订阅用户的状态
            await user_model.where({'openid':FromUserName}).update({'subscribe':0});
        }
    }

    /**
     * 获取素材详情
     */
    async getmaterialinfoAction(){

        let material_model = this.model('wx_material');
        let materid = this.post('id');
        let materialinfo = await material_model.where({id: materid}).find();
        //let api = new API('wxec8fffd0880eefbe', 'a084f19ebb6cc5dddd2988106e739a07');
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        let self = this;

        let info = function(api) {
            let deferred = think.defer();
            api.getMaterial(materialinfo.media_id,(err,result)=>{
                if(!think.isEmpty(result)){
                    deferred.resolve(result);
                }else{
                    Console.error('err'+err)
                }
            });
            return deferred.promise;
        }

        //let res =  await
        //    info(api);
        //

        let res = await info(api);
        console.log(res);




    }

    /**
     * 获取微信公众账号用户信息并保存到本地库
     */
    async getusersAction(){
        this.meta_title="获取粉丝信息";
        let user_model = this.model('wx_user');
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        let self = this;
        //获取关注者列表
        let users = function(api) {
            let deferred = think.defer();
            api.getFollowers((err,result)=>{
                if(!think.isEmpty(result)){
                   deferred.resolve(result);
                }else{
                    Console.error('err'+err)
                } 
            });
            return deferred.promise;
        }
        let res = await users(api);
        let useropenid = res['data']['openid'];
        let count = res['count'];
        //self.end(useropenid);
        //think.log(res);
        //批量获取用户基本信息
        let isadd = false;
        let tmp_openids = [];
        for(let i=0;i<count;i++){
            tmp_openids.push(useropenid[i]);
            if((i+1)%100 == 0 || i == (count-1)){
                //think.log('dd','aaa');
                 let userinfo = function(api) {
                    let deferinfo = think.defer();
                    api.batchGetUsers(tmp_openids,(err,result)=>{
                        if(!think.isEmpty(result)){
                        deferinfo.resolve(result);
                        }else{
                            Console.error('err'+err);
                        } 
                    });
                    return deferinfo.promise;
                }
                let resusers = await userinfo(api);
                let resinfo = resusers['user_info_list'];
                //console.log(resusers);
                //return false;
               //self.end(resinfo);
                console.log("开始：")
               for (let key in resinfo) {
                       let element = resinfo[key];
                       //self.end(element.openid);
                       console.log('-------------'+element.openid);
                       //let addres = await user_model.add(element);
                       //let nickname = element.nickname.replace(/(\\x[a-fA-F0-9]{2})*/g, ' ');
                       //let nickname = element.nickname.replace(/[\x80-\xfe]*/g, ' ');
                       //let nickname = removeFourChar(element.nickname);
                       let subscribe_time = element.subscribe_time*1000;
                       //element.nickname = nickname;
                       element.subscribe_time =subscribe_time;
                       
                       let addres = await user_model.thenAdd(element,{openid:element.openid});
                       console.log(addres);
                       if(addres.type=='exist'){
                           await user_model.where({openid:element.openid}).update(element);
                           isadd = true;
                       }
               }
               tmp_openids = [];
            }
        }
        if(isadd){
            this.success({name:"操作成功！",url:"/admin/mpbase/userlist"});
        }else{
            this.fail("error");
        }
    }
    

    /**
     * 根据条件筛选进行群发--通过openid,只能是认证服务号使用
     * 通过分组groupid进行群发，认证后的订阅号和服务号都可以使用
     */
    async masssendAction(){
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        //let api = new API('wxe8c1b5ac7db990b6', 'ebcd685e93715b3470444cf6b7e763e6');
        //let api = new API('wxec8fffd0880eefbe', 'a084f19ebb6cc5dddd2988106e739a07');
        let model = this.model('wx_user');
        let media_model = this.model('wx_material');
        let masssend_model = this.model('wx_masssend');
        let self = this;
        let send_type = this.post('send_type');//1:图文2：文字3：图片4：语音5：视频6：卡卷
        let group_id = this.post('group_id');
        let group_type = this.post('group_type');//0:全部用户1：分组
       // let media_id = 'WnHaYbbZUpy6xrrbADac_zObgAaFqh474Row6ar4PLJXEfVeA2OnR65uUSREYn_i';
        let me_id = this.post('me_id');
        let content = this.post('editor_content');
        content = content.replace(/<.*?mo-/g, '[').replace(/">/g, "]");
        //self.end(province+city);
        //查询条件
        let map={};
        let sex = this.post('sex');
        if(sex == 1 || sex == 2){
            map.sex = sex;
        }
        let province = this.post('provincetext');
        if(province != 0){
            map.province = province;
        }
        let city = this.post('citytext');
        if(city != 0){
            map.city = city;
        }
        //通过条件查询本地库数据
        let userinfo = await model.where(map).field('openid').select();
        let media_id = await media_model.where({'id':me_id}).getField('media_id');
        media_id = media_id[0];
        let openids = [];
        for (var key in userinfo) {
            //if (userinfo.hasOwnProperty(key)) {
            openids.push(userinfo[key].openid);
           // }
        }
        //self.end(aa);
        let res = '';
        
        //判断是通过groupid还是openid进行群发
        if(group_type == 1){
            //分组群发
            switch (send_type) {
                case 'newsArea'://图文
                    res = await massSendNews(api,media_id,group_id);
                    break;
                case 'textArea'://文本
                    res = await massSendText(api,content,group_id);
                    break;
                case 'imageArea'://图片
                    res = await massSendImage(api,media_id,group_id);
                    break;
                case 'audioArea'://语音
                    res = await massSendVoice(api,media_id,group_id);
                    break;
                case 'videoArea'://视频
                    res = await massSendVideo(api,media_id,group_id);
                    break;
            }
            
        }else{
            //根据条件通过openid进行群发
            switch (send_type) {
                case 'newsArea'://图文
                    res = await massSendNews(api,media_id,openids);
                    break;
                case 'textArea'://文本
                    res = await massSendText(api,content,openids);
                    break;
                case 'imageArea'://图片
                    res = await massSendImage(api,media_id,openids);
                    break;
                case 'audioArea'://语音
                    res = await massSendVoice(api,media_id,openids);
                    break;
                case 'videoArea'://视频
                    res = await massSendVideo(api,media_id,openids);
                    break;
            }
        }
        
        let msg_id = res['msg_id'];//发送成功返回消息ID
        //self.end(msg_id);
        
        //判断是否群发消息是否成功
        if(res['errcode'] == 0){
            //本地保存media_id和msg_id
            //查询图文内容
            let data = {};
            if(send_type == 'textArea'){
                data.msg_id = msg_id;
                data.material_wx_content = content;
                data.type = send_type;
            }else {
                if(me_id){
                    let wx_content = await media_model.where({'id':me_id}).find();
                    //self.end('aaa'+wx_content['material_content']);
                    let material_content = wx_content['material_content'];
                    let material_wx_content = wx_content['material_wx_content'];

                    data.mate_id = me_id;
                    data.msg_id = msg_id;
                    data.material_content = material_content;
                    data.material_wx_content = material_wx_content;
                    data.type = send_type;
                }
            }
            //self.end(data);
            let isAdd = masssend_model.thenAdd(data,{msg_id:msg_id});
            if(isAdd){
                this.assign({"navxs": true,"bg": "bg-dark"});
                return this.redirect("/admin/mpbase/mass");
            }
        }else{
            this.fail("error");
        }

        //this.assign({"navxs": true,"bg": "bg-dark"});
       //return this.display();
    }

    /**
     * 查询已发送的群发消息
     */
    async hassendAction(){
        let self = this;//{{item.material_wx_content}}
        let data = await this.model('wx_masssend').page(this.get('page')).countSelect();
        let Pages = think.adapter("pages", "page"); //加载名为 dot 的 Template Adapter
        let pages = new Pages(); //实例化 Adapter
        let page = pages.pages(data);
        let emoji = ["微笑","撇嘴","色","发呆","得意","流泪","害羞","闭嘴","睡","大哭","尴尬","发怒","调皮","呲牙","惊讶","难过","酷","冷汗","抓狂","吐","偷笑","可爱","白眼","傲慢","饥饿","困","惊恐","流汗","憨笑","大兵","奋斗","咒骂","疑问","嘘","晕","折磨","衰","骷髅","敲打","再见","擦汗","抠鼻","鼓掌","糗大了","坏笑","左哼哼","右哼哼","哈欠","鄙视","委屈","快哭了","阴险","亲亲","吓","可怜","菜刀","西瓜","啤酒","篮球","乒乓","咖啡","饭","猪头","玫瑰","凋谢","示爱","爱心","心碎","蛋糕","闪电","炸弹","刀","足球","瓢虫","便便","月亮","太阳","礼物","拥抱","强","弱","握手","胜利","抱拳","勾引","拳头","差劲","爱你","NO","OK","爱情","飞吻","跳跳","发抖","怄火","转圈","磕头","回头","跳绳","挥手","激动","街舞","献吻","左太极","右太极"];

        this.assign('emoji', emoji);
        this.assign('pagerData', page); //分页展示使用
        this.assign('list', data.data);

        this.assign({"navxs": true,"bg": "bg-dark"});
        return self.display();
    }

    /**
     * 查询消息URL
     */
    async findurlAction(){
        let self = this;
        let msg_id = this.get('msg_id');
        let status = this.get('status');
        //self.end(status);
        if(status){
            return this.redirect('http://www.baidu.com');
        }else{
            let masssend_model = this.model('wx_masssend');
            let news = await masssend_model.where({msg_id:msg_id}).getField('material_wx_content');
            news = JSON.parse(news);
            let news_item = news.news_item;
            //self.end(news_item[0]['url']);
            let url = news_item[0]['url'];
            return this.redirect(url);
        }
    }

    /**
     * 删除已发送的消息
     */
    async delmassAction(){
        let masssend_model = this.model('wx_masssend');
        let self = this;
        let msg_id = this.get('msg_id');
        //let isDel = await masssend_model.where({msg_id:msg_id}).delete();
        let isDel = await masssend_model.where({msg_id:msg_id}).update({del_status:1});
        if(isDel){
            this.success({name:"删除成功！",url:"/admin/mpbase/hassend"});
        }else{
            this.fail("error");
        }


    }



    /**
     * 查看用户列表
     */
    async userlistAction(){
        let data = await this.model('wx_user').page(this.get('page'),20).countSelect();
        let Pages = think.adapter("pages", "page"); //加载名为 dot 的 Template Adapter
        let pages = new Pages(); //实例化 Adapter
        let page = pages.pages(data);
        this.assign('pagerData', page); //分页展示使用
        this.assign('list', data.data);
        this.meta_title="微信用户管理"
        this.assign({"navxs": true,"bg": "bg-dark"});
        return this.display();
    }

    /**
     * 自定义菜单页面
     */
    async selfmenuAction() {
        this.meta_title="自定义菜单";
        let self = this;

        let menu_model =this.model("wx_menu");
        let data = await menu_model.order('pid ASC, sort ASC').select();
        console.log(JSON.stringify(data));

        let d = createSelfMenu(data);
        //console.log(d.menu.button[0]['type']);
        let str = JSON.stringify(d);
        this.assign('menu',str);
        return self.display();
    }

    /**
     * 发送菜单到微信端
     */
    async sendselfmenutowxAction(){
        let menu_model = this.model('wx_menu');
        let data = await menu_model.order('pid ASC, sort ASC').select();
        let menu = buildselfmenu(data);
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        //let api = new API('wx3e72261823fb62dd', '593bf2b86a00c913d8e38e9cf1d4e1ec');

        console.log(menu);
        let info = function(api) {
            let deferred = think.defer();
            api.createMenu(menu,(err,result)=>{
                if(!think.isEmpty(result)){
                    deferred.resolve(result);
                }else{
                    Console.error('err'+err)
                }
            });
            return deferred.promise;
        }
        let res = await info(api);
        console.log(res);
        if(res.errmsg == 'ok'){
            return this.json('1');
        }else{
            return this.json('2');
        }
    }

/*
        "m_id": time,
        "pid": "0",
        "type": "",
        "name": "菜单名称",
        "sort": (length+1),
        "sub_button": []
*/

    async ajaxaddmenuAction(){

        let m_id = this.post("id");
        let name = this.post("name");
        let sort = this.post('sort');
        let pid = this.post('pid');
        let type = this.post('type');
        let url = this.post('url');
        let web_token = '';
        let media_id = this.post('media_id');
        let menu_model =this.model("wx_menu");

        let data = {
            "m_id":m_id,
            "name":name,
            "sort":sort,
            "pid":pid,
            "type":type,
            "web_token":web_token,
            "media_id":media_id,
            "url":url
        };
        let res = await menu_model.add(data);
        if(res){
            return this.json("1");
        }else{
            return this.json("2");
        }
    }

    /**
     * 通过素材ID获取素材链接
     */
    async getmaterialbyidAction(){
        let model = this.model("wx_material");
        let id = this.post('id');
        let data = await model.where({id: id}).find();
        let url = JSON.parse(data.material_wx_content).news_item.url;
        return this.json(JSON.parse(data.material_wx_content).news_item[0].url);
    }

    /**
     * 通过ID获取素材信息
     */
    async getmaterialAction(){
        let model = this.model("wx_material");
        let id = this.get("id");
        let data = await model.find(id);
        return this.json(data);
    }
    //远程拿图片
    spiderImage(imgUrl, filePath) {
        let deferred = think.defer();
        http.get(imgUrl, function (res) {
            var imgData = "";
            res.setEncoding("binary");
            res.on("data", function (chunk) {
                imgData += chunk;
            });

            res.on("end", function () {
                fs.writeFileSync(filePath, imgData, "binary");
                deferred.resolve(filePath);
            });
        });
        return deferred.promise;
    }
    /**
     * 微信素材列表
     */
    async fodderlistAction() {
        let self = this;
        self.meta_title = "微信素材列表";
        self.assign({"navxs": true, "bg": "bg-dark"});
        let model = self.model("wx_material");
        let data = await model.page(this.get('page')).order('add_time DESC').countSelect();
        let Pages = think.adapter("pages", "page");
        let pages = new Pages();
        let page = pages.pages(data);
        self.assign('pagerData', page);
        self.assign('fodder_list', data.data);
        return this.display();
    }
    /**
     * 新建素材
     */
    fodderAction() {
        this.assign({"navxs": true, "bg": "bg-dark"});
        this.active="admin/mpbase/fodderlist";
        this.meta_title="新建微信素材";
        return this.display();
    }
    /**
     * 删除素材
     */
    async deletefodderAction() {
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        let self = this;
        let id = self.get('id');
        //let ids = self.get('ids')
        //return self.end(ids);
        let model = self.model('wx_material');
        let olddata = await model.where({id: ['IN', id]}).getField('media_id', false);
        // return self.end(olddata);
        let wxremove = function (api, data) {
            let deferred = think.defer();
            api.removeMaterial(data, (err, result)=> {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        }
        if (!think.isEmpty(olddata)) {
            let wxres = await wxremove(api, olddata[0]);
            // let wxres = { errcode: 0 };
            // try{
            //     for(let midi in olddata){
            //         await wxremove(self.api, olddata[midi]);
            //     }
            // }catch(e){
            //     return self.fail('删除失败');
            // }
            //console.log(wxres);
            if (wxres.errcode == 0) {
                let res = await model.where({id: ['IN', id]}).delete();
                // let res = true;
                if (res) {
                    return self.success({name: '删除成功'});
                }
            }
        }
        return self.fail('删除失败');
    }

    /**
     * 模态窗信息列表
     * @returns {*}
     */
    async asyncfodderlistAction() {
        let self = this;
        let model = self.model("wx_material");
        let data = await model.page(this.get('page'), 20).order("add_time DESC").countSelect();
        return this.json(data);
    }

    /**
     * 编辑
     */
    async foddereditAction() {
        let id = this.get('id');
        this.assign({"navxs": true, "bg": "bg-dark"});
        this.active="admin/mpbase/fodderlist";
        this.meta_title="编辑微信素材";
        let model = this.model("wx_material");
        let data = await model.where({'id': id}).find();
        this.assign('data', JSON.stringify(data));

        //this.end(data);
        return this.display('fodder');
    }
    /**
     * 给微信上传临时素材 /图片 更新本地库
     */
    async wxuploadtmpAction() {
        //上传图片
        // this.end("暂不开发");
        let thumb_id = this.get('thumb_id');
        let model = this.model('picture');
        // let data = await model.where({id:thumb_id}).find();
        //获取图片
        let pic = await get_pic(thumb_id, 1, 900, 500);
        //判断是本地还是外地,如果是外地就抓回来
        let paths;
        let filePath = think.RESOURCE_PATH + '/upload/long/';
        if (pic.indexOf("http://") == 0) {
            think.mkdir(filePath)
            let name = await get_cover(thumb_id, "path");
            let longpic = await this.spiderImage(pic, filePath + name);
            paths = longpic;
        } else {
            paths = think.ROOT_PATH + '/www/' + pic;
        }
        //console.log(pic);
        //return false;
        let wx = function (api, data) {
            let deferred = think.defer();
            api.uploadMaterial(data, 'thumb', (err, result)=> {
                if (!think.isEmpty(result)) {
                    deferred.resolve(result);
                } else {
                    console.error(err);
                }
            });
            return deferred.promise;
        }

        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        let img_result = await wx(api, paths);
        if (img_result) {
            //删除远程文件
            fs.unlinkSync(paths);
            await model.where({id: thumb_id}).update({url: img_result.url, source_id: img_result.media_id});
            img_result.hs_image_src = pic;
            return this.json(img_result);
        } else {
            return this.json("");
        }
    }

    /**
     * 上传保存永久素材
     */
    async savefodderAction() {
        let self = this;
        let params = self.post("params");
        let edit_id = self.get("edit_id");
        let model = self.model('wx_material');
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        if (edit_id) {
            let olddata = await model.where({id: edit_id}).find();
            let wxr = function (api, data) {
                let deferred = think.defer();
                api.removeMaterial(data, (err, result)=> {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(result);
                    }
                });
                return deferred.promise;
            }
            let wxrres = await wxr(api, olddata.media_id);
            let delrow = await model.where({id: edit_id}).delete();
        }
        try {
            var anews = JSON.parse(params);

            let wx = function (api, data) {
                let deferred = think.defer();
                api.uploadNewsMaterial(data, (err, result)=> {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(result);
                    }
                });
                return deferred.promise;
            }

            let wxres = await wx(api, anews);
            if (wxres) {
                let wxg = function (api, data) {
                    let deferred = think.defer();
                    api.getMaterial(data, (err, result)=> {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(result);
                        }
                    });
                    return deferred.promise;
                }
                let wx_news = await wxg(api, wxres.media_id);
                // let wx_news_str = JSON.stringify(wx_news);
                let time = new Date().getTime();
                let data = {
                    "media_id": wxres.media_id,
                    "material_content": params,
                    "material_wx_content": wx_news + '',
                    "web_token": 0,
                    "add_time": time
                }
                let effect = await model.add(data);
                if (effect) {
                    self.success({"name": "上传成功！", url: ""});
                }
            }
            self.fail("上传失败！");
        } catch (e) {
            self.fail("上传失败！");
        }
    }

    /**
     * 微信公众账号自动回复
     * @returns {*}
     */
    async autoreplyAction() {
        let rule = await this.model('wx_keywords_rule').where({}).select();
        for (let i = 0; i < rule.length; i++) {
            let current = rule[i];
            let ks = await this.model('wx_keywords').where({id: ['IN', current.keywords_id]}).select();
            let rs = await this.model('wx_replylist').where({id: ['IN', current.reply_id]}).select();
            rule[i].ks = ks;
            rule[i].rs = rs;
        }
        this.assign('rulelist', rule);
        this.assign({"navxs": true, "bg": "bg-dark"});
        this.meta_title="关键词回复"
        return this.display();
    }
    /**
     * 新建回复
     */
    async createrAction() {
        let self = this;
        let type = self.post('type');
        let ruleid = self.post('ruleid');
        if (!ruleid) {
            return self.fail('规则不存在');
        }
        let model = self.model('wx_replylist');
        let currtime = new Date().getTime();
        let currwebtoken = 0;
        let result = 0;
        await model.startTrans();
        switch (type) {
            case 'text':
                let content = self.post('content')
                result = await model.add({
                    'type': 'text',
                    'content': content,
                    'create_time': currtime,
                    'web_token': currwebtoken
                });
                break;
            case 'image':
                break;
            case 'audio':
                break;
            case 'video':
                break;
            case 'news':
                break;
        }

        if (result) {
            let rulemodel = self.model('wx_keywords_rule');
            let ruledata = await rulemodel.where({id: ruleid}).find();
            console.log(ruledata);
            let rs = ruledata.reply_id.split(',');
            rs.push(result);
            let r = await rulemodel.where({id: ruleid}).update({'reply_id': rs.join(','), 'create_time': currtime});
            if (r) {
                await model.commit();
                return self.success({name: '添加回复成功', rid: result});
            } else {
                await model.rollback();
                return self.fail('回复添加失败');
            }
        } else {
            await model.rollback();
            return self.fail('回复添加失败');
        }
    }
    /**
     * 编辑规则名称
     */
    async ruleeditnameAction() {
        let self = this;
        let ruleid = self.post('ruleid');
        let rulename = self.post('rulename');
        let rulemodel = self.model('wx_keywords_rule');
        let res = await rulemodel.where({id: ruleid}).update({rule_name: rulename});
        if (res) {
            return self.success({name: '编辑成功'});
        }
        return self.fail('编辑失败');
    }
    /**
     * 新建规则
     */
    async createkruleAction() {
        //let id = 1;
        let rule_name = this.get('rule_name');
        let model = this.model('wx_keywords_rule');
        let id = await model.add({'rule_name': rule_name, 'create_time': new Date().getTime()});
        if (id) {
            return this.success({name: "规则添加成功", ruleid: id});
        } else {
            return this.fail('添加规则失败');
        }
    }
    /**
     * 删除规则
     */
    async ruledeleteAction() {
        let self = this;
        let ruleid = self.post('ruleid');
        let rulemodel = self.model('wx_keywords_rule');
        await rulemodel.startTrans();
        let currentrule = await rulemodel.where({id: ruleid}).find();
        let kids = currentrule.keywords_id;
        let rids = currentrule.reply_id;
        let kmodel = self.model('wx_keywords');
        let rmodel = self.model('wx_replylist');
        let kres = await kmodel.where({id: ['IN', kids]}).delete();
        let rres = await rmodel.where({id: ['IN', rids]}).delete();
        let rulres = await rulemodel.where({id: ruleid}).delete();
        if (rulres) {
            await rulemodel.commit();
            return self.success({name: '规则删除成功'});
        } else {
            await rulemodel.rollback();
            return self.fail('规则删除失败');
        }
    }
    /**
     * 规则编辑 （关键字的添加和删除）
     */
    async ruleeditAction() {
        let self = this;
        let ruleid = self.post('ruleid');
        let rulemodel = self.model('wx_keywords_rule');
        let ruledata = await rulemodel.where({id: ruleid}).find();
        let currtime = new Date().getTime();
        let currwebtoken = 0;
        let edittype = self.post('edittype'); //判断是编辑关键字 1，还是回复内容 2
        if (edittype == 1 && ruleid) {
            //关键字操作
            let kmodel = self.model('wx_keywords');
            let kid = self.post('kid'); //如果带有kid表示该操作为删除，否则为添加
            if (kid) {
                let r = await kmodel.where({id: kid}).delete();
                if (r) {
                    let tmp = []
                    let ks = ruledata.keywords_id.split(',');
                    for (let v in ks) {
                        if (ks[v] != kid) {
                            tmp.push(ks[v]);
                        }
                    }
                    await rulemodel.where({id: ruleid}).update({'keywords_id': tmp.join(','), 'create_time': currtime});
                }
                return self.json(r);
            } else {
                //新建关键字
                let kname = self.post('name');
                let ktype = self.post('type');
                let r = 0;
                try {
                    r = await kmodel.add({
                        'keyword_name': kname,
                        'match_type': ktype,
                        'rule_id': ruleid,
                        'create_time': currtime,
                        'web_token': currwebtoken
                    });
                } catch (e) {
                    return self.json(-1);
                }
                if (r) {
                    let ks = ruledata.keywords_id.split(',');
                    ks.push(r);
                    await rulemodel.where({id: ruleid}).update({'keywords_id': ks.join(','), 'create_time': currtime});
                }
                return self.json(r);
            }
        } else if (edittype == 2 && ruleid) {
            //回复操作
        } else {
        }
    }
    /**
     * 删除回复
     */
    async deleterAction() {
        let self = this;
        let ruleid = self.post('ruleid');
        let rid = self.post('rid');
        let currtime = new Date().getTime();
        if (ruleid && rid) {
            let model = self.model('wx_replylist');
            await model.startTrans();
            let rr = await model.where({id: rid}).delete();
            if (rr) {
                let rulemodel = self.model('wx_keywords_rule');
                let ruledata = await rulemodel.where({id: ruleid}).find();
                let tmp = [];
                let rs = ruledata.reply_id.split(',');
                for (let i in rs) {
                    if (rs[i] != rid) {
                        tmp.push(rs[i]);
                    }
                }
                let r = await rulemodel.where({id: ruleid}).update({
                    'reply_id': tmp.join(','),
                    'create_time': currtime
                });
                if (r) {
                    await model.commit();
                    return self.success({name: '回复删除成功'});
                } else {
                    await model.rollback();
                    return self.fail('回复删除失败');
                }
            } else {
                await model.rollback();
                return self.fail('删除失败');
            }
        } else {
            return self.fail('提交参数错误');
        }
    }
    /**
     *  编辑回复
     */
    async editreplyAction() {
        let self = this;
        let type = self.post('type');
        let rid = self.post('ruleid');
        let model = self.model('wx_replylist');
        let currtime = new Date().getTime();
        let currwebtoken = 0;
        let result = 0;
        switch (type) {
            case 'text':
                let content = self.post('content')
                result = await model.where({id: rid}).update({
                    'content': content,
                    'create_time': currtime,
                    'web_token': currwebtoken
                });
                break;
            case 'image':
                break;
            case 'audio':
                break;
            case 'video':
                break;
            case 'news':
                break;
        }

        if (result) {
            return self.success({name: '编辑成功'});
        } else {
            return self.fail('编辑失败');
        }

    }
    /**
     * 消息自动回复
     */
    async messageAction() {
        let model = this.model('wx_replylist');
        //初始化数据
        let data = [
            {type: "text", reply_type: 2},
            {type: "news", reply_type: 2},
            {type: "image", reply_type: 2},
            {type: "music", reply_type: 2},
            {type: "video", reply_type: 2},
            {type: "voice", reply_type: 2}
        ]
        for(let v of data){
            await model.where(v).thenAdd(v);
        }
        let info = await model.where({reply_type: 2}).order("create_time DESC").select();
        this.assign('list', info);
        //初始化
        let initinfo = info[0];
        this.assign("initinfo",initinfo);
        this.assign({"navxs": true, "bg": "bg-dark"});
        this.meta_title = "消息自动回复";
        this.active = "admin/mpbase/autoreply";
        return this.display();
    }
    /**
     * 关注自动回复
     */
    async followAction() {
        let model = this.model('wx_replylist');
        //首次访问检查数据库有没有数据,如果没有就添加
        // 'news','music','video','voice','image','text'
        let data = [{type: "text", reply_type: 1}, {type: "news", reply_type: 1}, {
            type: "image",
            reply_type: 1
        }, {type: "music", reply_type: 1}, {type: "video", reply_type: 1}, {type: "voice", reply_type: 1}]
        for (let v of data) {
            await model.where(v).thenAdd(v)
        }
        let info = await model.where({reply_type: 1}).order("create_time DESC").select();
        this.assign('list', info);
        //初始化
        let initinfo = info[0];
        this.assign({"initinfo": initinfo});
        this.assign({"navxs": true, "bg": "bg-dark"});
        this.meta_title = "关注自动回复"
        this.active = "admin/mpbase/autoreply"
        return this.display();
    }
    /**
     * 保存回复数据
     */
    async saveinfoAction() {
        let model = this.model('wx_replylist');
        let media_model = this.model('wx_material');
        let reply_type = this.post('reply_type');
        let send_type = this.post('send_type');
        let editor_content = this.post('editor_content');
        let me_id = this.post('me_id') == "" ? null : this.post('me_id');
        //this.end(reply_type+send_type+editor_content);
        let data = {};
        //消息回复
        /*if(reply_type == 2){
         data.content = editor_content;
         }else if(reply_type == 1){
         //关注回复

         }*/
        //this.end(send_type);
        if (send_type == 'textArea') {
            data.type = 'text';
            data.content = editor_content;
        } else if (send_type == 'newsArea') {
            console.log(!think.isEmpty(me_id));
            if (!think.isEmpty(me_id)) {
                let wx_content = await media_model.where({'id': me_id}).find();
                //this.end('aaa'+wx_content['material_content']);
                let material_content = wx_content['material_content'];
                material_content = JSON.parse(material_content);
                let targetArr = [];
                let articles = material_content.articles;
                let host = `http://${this.http.host}`
                for (let key in articles) {
                    let tmpobj = {};
                    tmpobj.title = articles[key]['title'];
                    tmpobj.description = articles[key]['digest'];
                    if (articles[key]['hs_image_src'].indexOf("http://") == 0) {
                        tmpobj.picurl = articles[key]['hs_image_src'];
                    } else {
                        tmpobj.picurl = host + articles[key]['hs_image_src'];
                    }

                    tmpobj.url = articles[key]['content_source_url'];
                    targetArr.push(tmpobj);
                }
                data.content = JSON.stringify(targetArr);
            } else {
                data.content = null;
            }
            data.type = 'news';
            data.media_id = me_id;
        }
        data.reply_type = reply_type;
        data.create_time = new Date().getTime();
        data.id = this.post("id");
        //this.end(data);
        console.log(data);
        // return false;
        //查询该类型下是否有保存的回复信息
        let isAdd = '';
        isAdd = await model.update(data);
        if (isAdd) {
            if (reply_type == 2) {
                return this.success({name: "修改成功!", url: "/admin/mpbase/message"})
            } else if (reply_type == 1) {
                return this.success({name: "修改成功!", url: "/admin/mpbase/follow"})

            }
        }


    }

    /**
     * 打开自定义菜单
     */
    async custommenuAction() {
        let data = {
            version: 20120000,
            button: [
                {
                    name: '1个福彩蛋',
                    type: 1,
                    act_list: [],
                    sub_button: [
                        {
                            name: '投资赚钱吧',
                            type: 1,
                            act_list: [{type: 2, value: 'http://www.baidu.com'}],
                            sub_button: []
                        }
                    ]
                }
            ]
        }

        let self = this;
        let model = self.model('wx_custom_menu');
        let ddata = await model.where({personality: null}).find();
        self.assign('data', ddata.custom_menu);
        self.assign('menuid', ddata.id);
        self.meta_title = "微信自定义菜单";
        self.assign({"navxs": true, "bg": "bg-dark"});
        return this.display();
    }
    /**
     * 保存自定义菜单
     */
    async savecustommenuAction() {
        let self = this;
        let newv = self.post('newv');
        let menuid = self.post('menuid');//菜单ID
        let currwebtoken = 0;
        console.log(newv);
        //return false;
        try {
            // return self.end(newv);
            if (!newv) {
                return self.fail('参数错误');
            }
            //newv = JSON.parse(newv);
            let currtime = new Date().getTime();
            let model = self.model('wx_custom_menu');
            let res;
            if (think.isEmpty(menuid)) {
                res = await model.add({
                    create_time: currtime,
                    custom_menu: newv,
                    web_token: currwebtoken
                });
            } else {
                res = await model.update({
                    id: menuid,
                    create_time: currtime,
                    custom_menu: newv,
                    web_token: currwebtoken
                });
            }

            if (res) {
                return self.success({name: '菜单保存成功'});
            } else {
                return self.fail('菜单保存失败');
            }
        } catch (e) {
            return self.fail('参数错误');
        }
    }

    /**
     * 生成微信菜单
     */
    async asyncwxmenuAction() {
        let self = this;
        let model = self.model('wx_custom_menu');
        let data = await model.where({}).find();

        let wxsubmit = function (api, data) {
            let deferred = think.defer();
            api.createMenu(data, (err, result)=> {
                if (err) {
                    deferred.reject(false);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        }

        console.log(data);

        let dataObj = JSON.parse(data.custom_menu);
        let final = {button: []};
        // for(let i = 0; i < dataObj.button.length; i++){
        //     let btn = dataObj.button[i];
        //     let tmpbtn = { /*name:'', type:'', key:'', sub_button:''*/ };
        //
        //     tmpbtn.name = btn.name;
        //     if(btn.sub_button.length > 0){
        //         tmpbtn.sub_button = [];
        //         for(let j = 0; j < btn.sub_button.length; j++){
        //             let sub = btn.sub_button[i];
        //             let tmpsub = { /*name:'', type:'', key:'', sub_button:''*/ };
        //             tmpsub.name = sub.name;
        //             tmpsub.type = 'view';
        //             tmpsub.url = sub.act_list[i].value;
        //
        //             tmpbtn.sub_button.push(tmpsub);
        //         }
        //     }else if(!btn.hasOwnProperty('key')){
        //         btn.key = (new Date().getTime())+"KEY";
        //     }else{
        //     }
        //
        //     final.button.push( tmpbtn );
        // }
        for (let a of dataObj.button) {
            let tmpbtn = {};
            tmpbtn.name = a.name;
            //console.log(a);
            if (think.isEmpty(a.sub_button)) {
                //console.log(a.type);
                switch (a.type) {
                    case '1':
                        tmpbtn.type="click";
                        tmpbtn.key=a.act_list[0].value;
                        break;
                    case '2':
                        tmpbtn.type = "view";
                        tmpbtn.url = a.act_list[0].value;
                        break;
                }
            } else {
                tmpbtn.sub_button = [];
                for (let b of a.sub_button) {
                    let tmpsub = {};
                    tmpsub.name = b.name;
                    //console.log(b.type);
                    switch (b.type) {
                        case '1':
                            tmpsub.type="click";
                            tmpsub.key=b.act_list[0].value;
                            break;
                        case '2':
                            tmpsub.type = "view";
                            tmpsub.url = b.act_list[0].value;
                            break;
                    }
                    tmpbtn.sub_button.push(tmpsub);
                }
            }
            final.button.push(tmpbtn);
            console.log(tmpbtn);
        }
        think.log(final)
        //return false;
        let api = new API(this.setup.wx_AppID, this.setup.wx_AppSecret);
        let res = await wxsubmit(api, final);
        // let res = true;
        console.log(res);
        if (res) {
            return self.success({name: '微信菜单生成成功'});
        } else {
            return self.fail('微信菜单生成失败');
        }
    }
}