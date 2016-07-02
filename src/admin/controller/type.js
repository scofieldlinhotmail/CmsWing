'use strict';

import Base from './base.js';

export default class extends Base {
  init(http){
    super.init(http);
    this.tactive = "article"
  }

  /**
   * __before action
   * @private
     */
  async __before() {
   await super.__before();
   let typeoption = await this.model("typeoption").where({classid:0}).select();
    this.assign("typeoption",typeoption);
  }
  /**
   * index action
   * @return {Promise} []
   */
 async indexAction(){
    //auto render template file index_index.html
    let type = this.model("type");
    let list = await type.order('displayorder ASC,typeid DESC').select();
    //console.log(list);
      let cate = await this.model("category").where({documentsorts:['!=',""]}).select();
      for(let val of cate){
          let types = JSON.parse(val.documentsorts);
          let sortarr = []
          for(let v of types.types){
              sortarr.push(v.enable)
          }
          val.sortid=sortarr;
      }
      //console.log(cate);
      if(!think.isEmpty(cate)){
      for(let val of list){
          val.cate=[]
       for(let v of cate){
             if(in_array(val.typeid,v.sortid)){
                 let obj = {}
                 obj.id = v.id;
                 obj.title=v.title;
                 val.cate.push(obj)
             }
          }
      }
      }
      //console.log(list);
      this.assign("list",list);
    this.meta_title="分类管理"
    return this.display();
  }
    //分类信息设置
 async typeviewAction(){
     let id = this.get("typeid");
     let info = await this.model('type').find({where:{typeid:id}});
     let typeoption = await this.model('typeoption').where({classid:0}).select();
     let option = await this.model('typeoption').where({classid:['!=',0]}).select();
     for (let val of option){
         let sortid = await this.model('typevar').where({optionid:val.optionid}).getField('sortid');
         val.sortid = sortid;
     }
     let typevar = await this.model('typevar').join({
         typeoption:{
             on:['optionid','optionid']
         }
     }).where({sortid:id}).select();
     this.active="admin/type/index"
     console.log(typevar);
     this.assign({
         info:info,
         typeoption:typeoption,
         option:option,
         typevar:typevar
     })
     this.meta_title=`${info.name}-分类设置`
  return this.display();
 }
    async updatetypevarAction(){
        let data = this.post('data');
        data = JSON.parse(data);
       let del= await this.model('typevar').delete({
            where: {sortid: data.id}
        });

        let add= await this.model('typevar').addMany(data.datarr);
        if(!think.isEmpty(add)){
    return this.success({name:"操作成功"})
}
    }
  /**
   * topic action
   *
   */
  topicAction(){
    return this.display();
  }

  /**
   * type Action
   */
  async typeoptionAction(){
    let optionid = this.get("classid");
      let option = await this.model('typeoption').find({where:{optionid:optionid}});
      let optionlist = await this.model('typeoption').where({classid:optionid}).select();
      console.log(option);
      this.assign({
          option:option,
          optionlist:optionlist
      })
      this.meta_title=option.title;
      this.active="admin/type/index";
      return this.display();
  }
    async updatetypeoptionAction(){
     let data = this.post("data");
        data =JSON.parse(data);
     console.log(data)
        for(let val of data){
            //添加
            if(val.isdel==0 && val.title != 0 && val.optionid ==0){//添加
                this.model('typeoption').add(val);
            }else if(val.isdel==0 && val.title != 0 && val.optionid !=0){//更新
                this.model('typeoption').update(val,{optionid:val.optionid});
            }else if(val.isdel == 1){
                this.model('typeoption').delete({
                    where: {optionid: val.optionid}
                })
            }
        }
        return this.success({name:"操作成功"})
 }
    //编辑字段
    async edittypeAction(){
        if(this.isPost()){
            let data = this.post();
            console.log(data);
            let update = this.model('typeoption').where({optionid:data.optionid}).update(data);
            if(update){
                return this.success({name:"操作成功"});
            }else {
                return this.fail("操作失败");
            }
        }else {
            let id = this.get("optionid");
            let info = await this.model("typeoption").find({where:{optionid:id}});
            let clas = await this.model('typeoption').find({where:{optionid:info.classid}});
            console.log(info);
            this.assign({
                info:info,
                clas:clas
            })
            this.active="admin/type/index";
            this.meta_title="编辑"+info.title;
            return this.display();
        }

    }
  /**
   * 更新/修改数据
   */
 async updateAction(){
   let data = this.post("data");
      data = JSON.parse(data);
      console.log(data);
      for(let val of data){
          //添加
          if(val.isdel==0 && val.name != 0 && val.typeid ==0){//添加
             this.model('type').add(val);
          }else if(val.isdel==0 && val.name != 0 && val.typeid !=0){//更新
              this.model('type').update(val,{typeid:val.typeid});
          }else if(val.isdel == 1){
              this.model('type').delete({
                  where: {typeid: val.typeid}
              })
          }
      }

      //todo
      return this.success({name:"操作成功"})
  }
}
