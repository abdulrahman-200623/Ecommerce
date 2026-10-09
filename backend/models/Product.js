const mongoose=require("mongoose");
const schema=new mongoose.Schema({
 name:{type:String,required:true},description:String,price:{type:Number,required:true},
 originalPrice:Number,discount:Number,category:{type:String,required:true},image:String,
 rating:{type:Number,default:4.5},reviews:{type:Number,default:0},stock:{type:Number,default:0}
},{timestamps:true});
module.exports=mongoose.model("Product",schema);
