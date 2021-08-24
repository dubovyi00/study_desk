const {Schema,model,Types} = require('mongoose')

const schema = new Schema({

    usr_id: {type:String,require:true,unique:true},
    rooms: [{
        room_id: {type: String, require: true, unique: false},
        companionName: {type: String, require: true, unique: false},
        status: {type: Boolean, require: true, unique: false},
        img: {type: String, require: false, unique: false}
    }],
})
module.exports = model('RoomsList',schema)