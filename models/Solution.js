const {Schema,Type,model, Mongoose} = require('mongoose')



const schema = new Schema({
    user_id:{type:String,require:true,unique:false},
    task_id:{type:String,require:true,unique:false},
    timeCreated:{type:Date,require:true,unique:false},
    timeSubmited:{type:Date,require:true,unique:false},
    timeChecked:{type:Date,require:true,unique:false},
    status:{type:Number,require:true,unique:false},
	file:{
		name:{type:String,require:false,unique:false},
		path:{type:String,require:false,unique:false}
	}
})
module.exports = model ('Solution',schema) 