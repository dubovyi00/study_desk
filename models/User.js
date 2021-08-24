const {Schema,Type,model} = require('mongoose')

const schema = new Schema({
    NSTU_Id:{type:String,require:true,unique:true},
    Facultet_Id:{type:String,require:true,unique:false},
    Group_id:{type:String,require:true,unique:false},
    Sym_group:{type:String,require:true,unique:false},
    Name:{type:String,require:true,unique:false},
    Surname:{type:String,require:true,unique:false},
    Lastname:{type:String,require:true,unique:false}
})
module.exports = model ('User',schema) 