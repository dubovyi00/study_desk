const {Schema,Type,model} = require('mongoose')

const schema = new Schema({
    group:[{type:String,require:false,unique:false}],
    lesson_id:{type:String,require:false,unique:false},
    teacher_id:{type:String,require:false,unique:false},
    date:{type:Date,require:false,unique:false},
    title:{type:String,require:true,unique:true},
    description:{type:String,require:true,unique:false},
	methods:[{
        name:{type:String,require:false,unique:false},
        path:{type:String,require:false,unique:false}
    }],
    file:{
        name:{type:String,require:false,unique:false},
        path:{type:String,require:false,unique:false},
    }
})
module.exports = model ('Task',schema) 