const {Schema,model,Types} = require('mongoose')

const schema = new Schema({

    id: {type:String,require:true,unique:true},
    messages: [{
        //mess_id:{type:String,require:true,unique:false},
        
        text:{type:String,require:true,unique:false},
        createdAt:{type:Date, require:true, unique:false},
        user: {
            _id:{type:String,require:true,unique:false},
            name:{type:String,require:true,unique:false},
        },
        image:{type:String,require:false,unique:false},
        sent:{type:Boolean,require:true,unique:false},
        recieved:{type:Boolean,require:true,unique:false},
        pending:{type:Boolean,require:true,unique:false},
    }],
})
module.exports = model('Rooms',schema)