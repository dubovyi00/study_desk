const {Schema,Type,model} = require('mongoose')

const schema = new Schema({
    src:{type:String,require:true,unique:true}
})
module.exports = model ('Image',schema) 