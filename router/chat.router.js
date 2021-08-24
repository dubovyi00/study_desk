const {Router} = require('express')
const express = require('express')
const User = require('../models/User')
const RoomsList = require('../models/RoomsList')
const Room = require('../models/Room')
const config = require('config')
const fetch = require("node-fetch")
const {check,validationResult} = require('express-validator')
const mongoose = require('mongoose')
const e = require('express')
const router = Router()

var WebSocket  = new require('ws');



// WebSocket-сервер на порту 6000
var wsServer = new WebSocket.Server({
  port: 6000
});

async function getIsStudentAndId({access_token_cookie, refresh_token_cookie}) {
	var id = null
	var isStudent = true
	
	let string = ''
    string = 'access_token_cookie=' + access_token_cookie + ';' + 'refresh_token_cookie=' + refresh_token_cookie
    let tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_my_id_student'

    let response = await fetch(tolink, {
        method: 'get',
        credentials: "same-origin",
        headers: {
            cookie: string
        },
    })

    if (!response.ok) {
		throw { message: "Неверный токен!" };
    }
	
	let json = await response.json()
		
    id = json[0].ID_STUDENT
		
	if(id == null) {
		isStudent = false
		let tolink2 = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_my_id_person'

		let response2 = await fetch(tolink2, {
			method: 'get',
			credentials: "same-origin",
			headers: {
				cookie: string
			},
		})
		
		if (!response2.ok) {
			throw { message: "Неверный токен!" };
		}
		
		let json2 = await response2.json()
		
		id = json2[0].ID_PERSON
	}
	
	if(id == null) {
		throw { message: "Вы не студент и не сотрудник!" };
	}
	
	return {id:id, isStudent:isStudent}
}

function checkUser(data) {
    let string=''
    string = 'access_token_cookie='+req.body.access_token_cookie+';'+'refresh_token_cookie='+req.body.refresh_token_cookie
    console.log(string)
    let response = fetch(`https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_student_info`,{
        method:'get',
        credentials: "same-origin",
        headers:{
            cookie: string
        },
    })
    let json = response.json()
    if (json.msg != undefined) {
        if (json.msg === 'Token has expired') {
            return false
        }
    } else {
        return true
    }
}

async function teacherData(data) {
    var name
    var string=''
    string = 'access_token_cookie='+data.access_token_cookie+';'+'refresh_token_cookie='+data.refresh_token_cookie
    let teacher_id = (!data.id) ? "" : ("/" + data.id)
    var tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_teacher_info' + teacher_id
	console.log("teacherData debug", "tolink", tolink)
	console.log("teacherData debug", "string", string)
	
	try {
		var response = await fetch(tolink,{
			method:'get',
			credentials: "same-origin",
			headers:{
				cookie: string
			},
		})
	
        if(response.ok){
            let json = await response.json()
			name = json[0].SURNAME + ' ' + json[0].NAME + ' ' + json[0].PATRONYMIC
            console.log("teacherData debug", "name inside",name)
			return name
        }
        else{
			name = "Token processing error!"
			return name
        }
    } catch (e) {
        console.log("Error: ", e.message)
		name = "Token processing error!"
		return name
    }
}

async function teacherPic(data) {
    var img
    var string=''
    string = 'access_token_cookie='+data.access_token_cookie+';'+'refresh_token_cookie='+data.refresh_token_cookie
    let teacher_id = (!data.id) ? "" : ("/" + data.id)
    var tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_teacher_info' + teacher_id
	console.log("teacherData debug", "tolink", tolink)
	console.log("teacherData debug", "string", string)
	
	try {
		var response = await fetch(tolink,{
			method:'get',
			credentials: "same-origin",
			headers:{
				cookie: string
			},
		})
	
        if(response.ok){
            let json = await response.json()
			img = json[0].PORTRAIT_URL
            console.log("teacherData debug", "portrait src inside",img)
			return img
        }
        else{
			img = "Token processing error!"
			return img
        }
    } catch (e) {
        console.log("Error: ", e.message)
		img = "Token processing error!"
		return img
    }
}

async function studentData(data) {
    var name
    var string=''
    string = 'access_token_cookie='+data.access_token_cookie+';'+'refresh_token_cookie='+data.refresh_token_cookie
    var student_id = (!data.id)?"":("/"+data.id)
    var tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_student_info'+student_id
	
		
	console.log("studentData debug", "tolink", tolink)
	console.log("studentData debug", "string", string)
	
	try {
		var response = await fetch(tolink,{
			method:'get',
			credentials: "same-origin",
			headers:{
				cookie: string
			},
		})
	
        if(response.ok){
            let json = await response.json()
			name = json[0].SURNAME + ' ' + json[0].NAME
            console.log("studentData debug", "name inside",name)
			return name
        }
        else{
			name = "Token processing error!"
			return name
        }
    } catch (e) {
        console.log("Error: ", e.message)
		name = "Token processing error!"
		return name
    }
}	

var clients = []

wsServer.on('connection', function(wsClient) {
    var access_token_cookie;
    var refresh_token_cookie;
    var roomId;
    
    wsClient.on('message', async function(message) {
        data = JSON.parse(message);
        console.log("[ChatSocket] Сработал message: " + message);
        if (data.ms_type == 1) {
            clients.push({
                socketData: wsClient,
                usr_id: data.myId,
                room_id: data.roomId
            })

            var itWorks = true;
			// изменяем статуса чата с непрочитанного на прочитанное
			try{
				console.log("[ChatSocket] inside my id: #"+data.myId)				
				
				RoomsList.findOne({usr_id: data.myId}, function(err,document) {


					console.log("[ChatSocket] inside room id: #"+data.roomId)

                    if (err) { 
                        //res.sendStatus(400);
                        //mongoose.disconnect();
                        wsClient.send("error when processing room")
                        itWorks = false;
                    }
                    else {
                        if (document) {
                            var which = 0;
                            document.rooms.forEach((value, index) => {
                                if (value.room_id === data.roomId) {
                                    which = index

                                }
                            })

                            document.rooms[which].status = false
                            document.markModified("rooms")
                            document.save()
    
                        } else {
                            console.log("[ChatSocket] no room id: #"+data.roomId)
                            itWorks = false
				            wsClient.send("no such room")
                            
                        }
                    }
					//try{
					//	console.log("[ChatSocket] document.rooms: "+JSON.stringify(document.rooms))
						
					//} catch(ex) {
						//console.log("error in 205 line:", ex)
                        
					//}
				})
				
				
			} catch(err) {
				//console.log("[ChatSocket] no room id: #"+data.roomId)
                console.log("Error: ", e.message)
                itWorks = false
                wsClient.json("External database error!")
				//wsClient.send("no such room")
			}

            try {
                // изменения поля received при открытии чата
                Room.findOne({id: data.roomId}, function(err,document) {
                    if (err) { 
                        //res.sendStatus(400);
                        //mongoose.disconnect();
                        wsClient.send("error when processing room")
                        itWorks = false;
                    }
                    else {
                        if (document) {
                            document.messages.forEach((val, index) => {
                                if (val._id != data.myId) {
                                    val.recieved = true
                                }
                            })
                            document.markModified("messages")
                            document.save()
    
                        } else {
                            console.log("[ChatSocket] no room id: #"+data.roomId)
                            itWorks = false
				            wsClient.send("no such room")
                            
                        }
                    }

                    //try{
                    //    
                    //}catch(ex){
                    //    console.log(ex)
                    //}
                })
            } catch (e) {
                console.log("Error: ", e.message)
                itWorks = false
                wsClient.json("External database error!")
            }
            

            // сохраняем токены в памяти
            if (itWorks) {
                access_token_cookie = data.access_token_cookie
                refresh_token_cookie = data.refresh_token_cookie
                roomId = data.roomId
            }
            
        } 

		else if (data.ms_type == 2) {

            console.log("[ChatSocket] Получено сообщение: ", data);

            // получаем имя пользователя
            var name = await studentData({
                access_token_cookie: access_token_cookie,
                refresh_token_cookie: refresh_token_cookie,
                id: data.messages.user._id
            })//.then((name)=>{
				
			
			
				console.log("[ChatSocket] name before adding: ", name);

				if (name != "Token processing error!") {
					// формируем объект с сообщением
					let msg = {
						"_id": mongoose.Types.ObjectId(),
						"text": data.messages.text,
						"createdAt": data.messages.createdAt,
						"user": {
					  "_id": data.messages.user._id,
					  "name": name
						},
						"sent": true,
						"recieved": false,
						"pending": false
						}
					if (data.messages.image != undefined) {
						msg['image'] = data.messages.image;
					}
					// сохранение сообщения в БД
					console.log("[ChatSocket] before adding: " + JSON.stringify(msg));
					console.log("[ChatSocket] before adding roomId: " + roomId);
					
					var itWorks = true
                    try {
                        Room.findOne({id: roomId}, function(err,document) {
                            if (err) { 
                                wsClient.send("error when processing room")
                                itWorks = false;
                            }
                            else {
                                if (document) {
                                    document.messages.push(msg);
                                    document.markModified("messages")
                                    document.save()
                                    console.log("[ChatSocket] document.saved!");
            
                                } else {
                                    console.log("[ChatSocket] no room id: #"+data.roomId)
                                    itWorks = false
                                    wsClient.send("no such room")
                                    
                                }
                            }
                            
                        })
                    } catch (e) {
                        console.log("Error: ", e.message)
                        itWorks = false
                        wsClient.json("External database error!")
                    }
                    console.log("it works? "+itWorks)
					if (itWorks) {
                        var toClient = {
                            "_id": data.messages._id, 
                            "createdAt": data.messages.createdAt, 
                            "text": data.messages.text, 
                            "user": { 
                                "_id": data.messages.user._id,
                                "name": name
                            }
                        }
                        
                        console.log("[ChatSocket] clients data: " + JSON.stringify(clients))
    
                        clients.forEach(function each(client) {
                            if (/*client.usr_id != data.messages.user._id && */
                                client.room_id === roomId) {
                                client.socketData.send(JSON.stringify(toClient));
                            }
                          });
                    }

                    
                    //wsClient.send(JSON.stringify(toClient))
				} else {
					wsClient.send(name)
				}
			//})
        }

    });
})


const jsonParser = express.json()
router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

async function func() {
    try {
      const result = await RoomsList.findOne({usr_id: id});
      if (!result) {
            return { "msg": "No user with this id! "}
      } else {
        return result
      }
    } catch (err) {
        return console.log(err);
    }
  }


router.post("/rooms", jsonParser, async function(req, res, next) {
    if(!req.body) return res.sendStatus(400)
    console.log(req.body)
    try {
        const roomslist = new RoomsList(req.body);
        console.log(roomslist);
        await roomslist.save()
                .then(function(doc){
                    
                    console.log("Объект успешно сохранён", doc);
                    //mongoose.disconnect();
                })
                .catch(function (err){
                    console.log(err);
                   // mongoose.connection.close();
                });
        res.sendStatus(200);
    } catch (e) {
        console.log("Error: ", e.message)
        res.send(e.message);
    }
})

router.put("/rooms", jsonParser, async function(req,res,next) {
    try {
		var data = await getIsStudentAndId({access_token_cookie: req.body.access_token_cookie, refresh_token_cookie: req.body.refresh_token_cookie}) 
        console.log("studentData "+JSON.stringify(data))
        console.log("id type " + typeof data.id)
        var roomlist = { "msg": "No user with this id!"}
            try {
                roomlist = await RoomsList.find({usr_id: data.id.toString()},
                async function (err, rl) {
                    console.log("error, if exists: " + JSON.stringify(err));
                    console.log("roomlist: " + JSON.stringify(rl));
                    
                    if (err) { 
                        res.sendStatus(402);
                        //mongoose.disconnect();
                        return console.log(err); 

                    }
                    else {
                        if (rl) {
                            console.log(rl);
                            //mongoose.disconnect();
                            return rl;
    
                        } else {
                            res.sendStatus(403);
                           // mongoose.disconnect();
                            return {"msg": "No user with this id!"};
                        }
                    }
                    
                    
                }).then()
            
                res.send(roomlist)
            } catch(e) {
                console.log("Error: ", e.message)
                res.status(503).json({ message: "Внутренняя ошибка базы данных!" })
            }
            
    } catch (e) {
        console.log("Error: ", e.message)
        res.status(400).json({ message: "Неверный токен!" })
    }
})

router.post("/room", jsonParser, async function(req, res, next) {
    if(!req.body) return res.sendStatus(400)
    console.log(req.body)
    try {
        const room = new Room(req.body);
        await room.save()
                .then(function(doc){
                    console.log("Объект успешно сохранён", doc);
                    //mongoose.disconnect();
                })
                .catch(function (err){
                    console.log(err);
                    //mongoose.disconnect();
                });
        res.sendStatus(200);
    } catch (e) {
        console.log("Error: ", e.message)
        res.send(e.message);
    }
})

router.put("/room", jsonParser, async function(req,res,next) {
    if(!req.body) return res.sendStatus(400)
    console.log(req.body)
    try {
		var data = await getIsStudentAndId({access_token_cookie: req.body.access_token_cookie, refresh_token_cookie: req.body.refresh_token_cookie})
		
        var id = data.id
        var room = { "msg": "No user with this id!"}
        try {
            room = await Room.find({id: req.body.roomId.toString()},
            function (err, r) {
    
                if (err) { 
					res.sendStatus(402);

					return console.log(err);

				}
    
                if (r) {
                    console.log(r);
                    return r;
                }
                else {
					res.sendStatus(403);
                    return {"msg": "No user with this id!"};
                }
            })
            res.send(room)
        } catch (e) {
            console.log("Error: ", e.message)
            res.status(503).json({ message: "Внутренняя ошибка базы данных!" })
        }
        
    } catch (e) {
        res.status(400).json({ message: "Неверный токен!" })
    }
})

router.post("/create_chat", jsonParser, async function(req, res, next) {
    //{access_token_cookie:this.state.accessToken, refresh_token_cookie:this.state.refreshToken, id: id}
    if(!req.body) return res.sendStatus(400)
    console.log(req.body)
    try {
        var toId = req.body.id
        var status = true
        // генерируем айдишник комнаты
        var roomId = ""
        while (roomId.length < 30) {
            roomId += Math.random().toString(36).substring(2);
        }
        roomId.substring(0, 30)
        var toImg = (await teacherPic({
            access_token_cookie: req.body.access_token_cookie,
            refresh_token_cookie: req.body.refresh_token_cookie,
            id: toId
        }))
        if (toImg === null) {
            toImg = "https://sd.randgor.ru/app/teacher_placeholder.png"
        }
        // формируем данные о комнате
        var roomHead = {
            "_id": mongoose.Types.ObjectId(),
            "room_id": roomId,
            "companionName": "здарова я макс",
            "status": false,
            "img": "https://sd.randgor.ru/app/teacher_placeholder.png",
        }
        var roomData = {
            "id": roomId,
            messages: []
        }

        // получаем  идентификатор наш
        var fromId = (await getIsStudentAndId({
            access_token_cookie: req.body.access_token_cookie,
            refresh_token_cookie: req.body.refresh_token_cookie,
        })).id

        // получаем имена пользователей
        fromName = await studentData({
            access_token_cookie: req.body.access_token_cookie,
            refresh_token_cookie: req.body.refresh_token_cookie,
            id: fromId
        })
        if (fromName === "Token processing error!") {
            status = false
        }
        console.log("create chat id from " + fromId)
        console.log("create chat name from " + fromName)
        toName = await studentData({
            access_token_cookie: req.body.access_token_cookie,
            refresh_token_cookie: req.body.refresh_token_cookie,
            id: toId
        })
        if (toName === "Token processing error!" ) {
            toName = await teacherData({
                access_token_cookie: req.body.access_token_cookie,
                refresh_token_cookie: req.body.refresh_token_cookie,
                id: toId
            })
        }
        if (toName === "Token processing error!" ) {
            status = false
        }
        console.log("create chat id to " + toId)
        console.log("create chat name to " + toName)
        if (status) {
            try {
                var alreadyExists = false
                console.log("start saving room")
                // изменяем записи в списках комнат
                await RoomsList.findOne({usr_id: fromId}, function(err,document) {
                    console.log("connecting room to you")
                    var roomHead1 = {
                        "_id": roomHead._id,
                        "room_id": roomHead.room_id,
                        "status": false,
                    }
                    roomHead1["companionName"] = toName
                    roomHead1["img"] = toImg

                    if (err) { 

                        res.sendStatus(400);

                        status = false
                        return console.log(err);
                        
                    }

                    if (!document) {
                        var roomlisthead = {
                            "_id": mongoose.Types.ObjectId(),
                            "usr_id": fromId,
                            "rooms": [roomHead1]
                        }
                        const r = new RoomsList(roomlisthead);
                        r.save();
                        //document.save()
                        console.log("document.saved!");
                        return roomHead1.room_id
                    } else {
                        
                        document.rooms.forEach((val, index) => {
                            if (val.companionName === toName) {
                                alreadyExists = true
                                roomId = val.room_id
                                console.log("this room is already exists!")
                            }
                        })
                        if (!alreadyExists) {
                            document.rooms.push(roomHead1);
                            document.markModified("rooms")
                            document.save()
                            console.log("document.saved!");
                        }
                        
                    }
                    
                    
                    
                })
            
                if (!alreadyExists) {
                    await RoomsList.findOne({usr_id: toId}, function(err,document) {
                        console.log("connecting room to receiver")
                        roomHead["companionName"] = fromName
                        roomHead["img"] = "https://sd.randgor.ru/app/student_placeholder.png"
                        if (err) { 
                            status = false
                        }
        
                        if (!document) {
                            var roomlisthead = {
                                "_id": mongoose.Types.ObjectId(),
                                "usr_id": toId,
                                "rooms": [roomHead]
                            }
                            const r = new RoomsList(roomlisthead);
                            r.save();
                            //document.save()
                            console.log("[ChatSocket] document.saved!");
                        } else {
                            document.rooms.push(roomHead);
                            document.markModified("rooms")
                            document.save()
                            console.log("[ChatSocket] document.saved!");
                        }
                    })
                    console.log("create room")
                    const room = new Room(roomData);
                    await room.save()
                        .then(function(doc){
                            console.log("Объект успешно сохранён", doc);
                            //mongoose.disconnect();
                            //res.sendStatus(200);
                        })
                        .catch(function (err){
                            console.log(err);
                            //mongoose.disconnect();
                            status = false
                        });
                    //res.sendStatus(200);
                }
            } catch (e) {
                console.log("Error: ", e.message)
                res.status(503).json({ message: "Внутренняя ошибка базы данных!" })
            }
                
            }
            
             
        //
        if (status) {
            res.send({"json": [{"room_id": roomId, "my_id": fromId}]});
        } else {
            res.sendStatus(400);
        }
    } catch (e) {
        console.log("Error: ", e.message)
        res.send(e.message);
    }
})

router.put("/id_n_profile", jsonParser, async function(req,res,next) {
    if(!req.body) return res.sendStatus(400)
	
	try {
		var data = await getIsStudentAndId({access_token_cookie: req.body.access_token_cookie, refresh_token_cookie: req.body.refresh_token_cookie})
		res.send({data});
	} catch (exc) {
        res.status(400).json({ message: "Неверный токен!" })
	}
})

module.exports = router