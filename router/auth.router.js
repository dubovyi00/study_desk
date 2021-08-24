const { Router } = require('express')
const express = require('express')
const User = require('../models/User')
const Task = require('../models/Task')
const config = require('config')
const fetch = require("node-fetch")
const { check, validationResult } = require('express-validator')
const router = Router()
const Solution = require('../models/Solution')
const jsonParser = express.json()
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const pdfLib = require('pdf-lib');
const toPdf = require('mso-pdf')
const fs = require('fs');
const atob = require("atob");
const Blob = require('node-blob');
const PDFDocument = require('pdfkit');
const path = require('path');
const sizeOf = require('image-size')
const libre = require('libreoffice-convert');
const fileConvert = require("../own_modules/randgor_pdf_conv");


router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

router.use(bodyParser.json({ type: 'application/vnd.custom-type', extended: true, limit: '10000Mb' }));
router.use(bodyParser.urlencoded({ extended: true, limit: '10000Mb' }))

//@throws {id:id, isStudent:isStudent}
async function getIsStudentAndId({ access_token_cookie, refresh_token_cookie }) {
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

    if (id == null) {
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

    if (id == null) {
        throw { message: "Вы не студент и не сотрудник!" };
    }

    //TODO:MOCK
    return { id: id, isStudent: isStudent }
    return { id: 821, isStudent: false }
}

function getGroupsArray(groupRaw) {
    groupParts = groupRaw.split(" ")
    oldbase = ""
    trueGroups = []
    for (i = 0; i < groupParts.length; i++) {
        if (groupParts[i].includes("-")) {
            oldbase = groupParts[i].substring(0, groupParts[i].indexOf("-"))
            groupParts[i] = groupParts[i].replace(oldbase + "-", "")
        }
        trueGroups.push(oldbase + "-" + groupParts[i])
    }
    return trueGroups
}

router.post("/login", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/token/auth`, {
            method: 'post',
            credentials: "same-origin",
            headers: {
                "X-OpenAM-Username": req.body.data.username,
                "X-OpenAM-Password": req.body.data.password
            },
        })

        if (response.ok) {
            let all_tokens = response.headers.get('set-cookie')
            console.log(new Date().toISOString(), all_tokens)
            let access_token = /(?<=access_token_cookie=).*?(?=;)/.exec(all_tokens)[0]
            let refresh_token = /(?<=refresh_token_cookie=).*?(?=;)/.exec(all_tokens)[0]

            let string = 'access_token_cookie=' + access_token + ';' + 'refresh_token_cookie=' + refresh_token

            var data = await getIsStudentAndId({ access_token_cookie: access_token, refresh_token_cookie: refresh_token })

            res.json({ access_token: access_token, refresh_token: refresh_token, is_student: data.isStudent, id: data.id })

            //string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
            let student_id = (!data.id) ? "" : ("/" + data.id)
            let tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_student_info' + student_id
            try {
                let response = await fetch(tolink, {
                    method: 'get',
                    credentials: "same-origin",
                    headers: {
                        cookie: string
                    },
                })
                if (response.ok) {
                    console.log("start get_student_info")
                    let json = await response.json()
                    let docs = await User.find({ NSTU_Id: json[0].ID.toString() }, async function (err, docs) {
                        console.log("error, if exists: " + JSON.stringify(err));
                        if (err) return console.log(err)
                        else {
                            console.log(docs)
                            if (docs) {
                                console.log("we have user with this id")
                                //mongoose.disconnect();
                                return docs;
                            }
                            else {
                                console.log("we do not have user with this id")
                                // mongoose.disconnect();
                                return [];
                            }
                        }



                    })
                    console.log("found data: " + JSON.stringify(docs));
                    if (docs.length === 0) {
                        console.log("there is no user with this data, saving information")
                        let user = new User({
                            NSTU_Id: json[0].ID,
                            Facultet_Id: json[0].ID_FACULTET, Group_id: json[0].ID_GROUP, Sym_group: json[0].SYM_GROUP, Name: json[0].NAME, Surname: json[0].SURNAME,
                            Lastname: json[0].PATRONYMIC
                        })
                        try {
                            await user.save()
                        } catch (e) {
                            console.log("Error: ", e.message)
                            res.status(503).json({ message: "Внутренняя ошибка базы данных!" })
                        }

                    }
                }
                else {
                    let json = await response.json()
                    console.log("check_token debug get_student_info fail log:", JSON.stringify(json))
                    res.status(400).json({ message: "Неверный токен!" })
                    return response
                }
            } catch (e) {
                console.log("Error: ", e.message)
                res.status(503).json({ message: "Внутренняя ошибка сервера НГТУ!" })
            }

        }
        else {
            res.status(400).json({ message: "Неверные данные при авторизации!" })
            return response
        }

    } catch (e) {
        console.log("Error: ", e.message)
        res.status(500).json({ message: "Сервер НГТУ не работает!" })
    }

})

router.post("/check_token", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        //console.log(string)
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_my_id_student`, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })
        if (response.ok) {
            res.status(201).json({ message: "Токен валидный!" })
        }
        else {
            let json = await response.json()
            console.log("check_token debug check_token fail log:", JSON.stringify(json))
            res.status(400).json({ message: "Токен невалидный!" })
            return response
        }
    } catch (e) {
        console.log(e.message)
    }
})

router.post("/get_student_id", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_my_id_student'

        let response = await fetch(tolink, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let json = await response.json()
            console.log(typeof (json))
            res.json({ json })
        }
        else {
            res.status(400).json({ message: "Неверный id!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.post("/get_teacher_id", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_my_id_person'

        let response = await fetch(tolink, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let json = await response.json()
            //TODO:MOCK
            //json[0].ID_PERSON = 821
            console.log("json", json[0].ID_PERSON)
            res.json({ json })
        }
        else {
            res.status(400).json({ message: "Неверный id!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.post("/get_student_info", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let student_id = (!req.body.id) ? "" : ("/" + req.body.id)
        let tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_student_info' + student_id

        let response = await fetch(tolink, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })
        if (response.ok) {
            console.log("start get_student_info")
            let json = await response.json()
            let docs = await User.find({ NSTU_Id: json[0].ID.toString() }, async function (err, docs) {
                console.log("error, if exists: " + JSON.stringify(err));
                if (err) return console.log(err)
                else {
                    console.log(docs)
                    if (docs) {
                        console.log("we have user with this id")
                        //mongoose.disconnect();
                        return docs;
                    }
                    else {
                        console.log("we do not have user with this id")
                        // mongoose.disconnect();
                        return [];
                    }
                }



            })
            console.log("found data: " + JSON.stringify(docs));
            if (docs.length === 0) {
                console.log("there is no user with this data, saving information")
                let user = new User({
                    NSTU_Id: json[0].ID,
                    Facultet_Id: json[0].ID_FACULTET, Group_id: json[0].ID_GROUP, Sym_group: json[0].SYM_GROUP, Name: json[0].NAME, Surname: json[0].SURNAME,
                    Lastname: json[0].PATRONYMIC
                })
                try {
                    await user.save()
                } catch (e) {
                    console.log("Error: ", e.message)
                    res.status(503).json({ message: "Внутренняя ошибка базы данных!" })
                }

            }
            res.json({ json })
        }
        else {
            let json = await response.json()
            console.log("check_token debug get_student_info fail log:", JSON.stringify(json))
            res.status(400).json({ message: "Неверный токен!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.post("/get_teacher_info", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let teacher_id = (!req.body.id) ? "" : ("/" + req.body.id)
        let tolink = 'https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_teacher_info' + teacher_id

        let response = await fetch(tolink, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let json = await response.json()
            console.log(typeof (json))
            //console.log(json[0].ID)
            res.json({ json })
            //console.log(json)
        }
        else {
            let json = await response.json()
            console.log("check_token debug get_teacher_info fail log:", JSON.stringify(json))
            res.status(400).json({ message: "Неверный токен!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.post("/week_num", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_week_number`, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let json = await response.json()
            console.log(typeof (json))
            //console.log(json[0].ID)
            res.json({ json })
            //console.log(json)
        }
        else {
            res.status(400).json({ message: "Неверный id!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.post("/teacher_schedule", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let teacher_id = (!req.body.id) ? "" : ("/" + req.body.id)
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_teacher_schedule` + teacher_id, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let json = await response.json()
            res.json({ json })
        }
        else {
            res.status(400).json({ message: "Неверный id!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.post("/student_schedule", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_student_schedule/` + req.body.id, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let json = await response.json()
            console.log(typeof (json))
            res.json({ json })
        }
        else {
            res.status(400).json({ message: "Неверный id!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})

router.put("/refresh_token", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/token/refresh`, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })

        if (response.ok) {
            let all_tokens = response.headers.get('set-cookie')
            console.log(new Date().toISOString(), all_tokens)
            let access_token = /(?<=access_token_cookie=).*?(?=;)/.exec(all_tokens)[0]
            let refresh_token = /(?<=refresh_token_cookie=).*?(?=;)/.exec(all_tokens)[0]

            res.json({ access_token: access_token, refresh_token: refresh_token })
        }
        else {
            let json = await response.text()
            console.log("check_token debug refresh_token fail log:", json)

            res.status(400).json({ message: "Неверный токен!" })
            return response
        }
    } catch (e) {
        console.log("Error: ", e.message)
    }
})


router.post("/add_task", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)

    var data;
    try {
        data = await getIsStudentAndId({ access_token_cookie: req.body.access_token, refresh_token_cookie: req.body.refresh_token })

        if (data.isStudent) {
            res.status(401).json({ message: "Вы не преподаватель чтобы давать задание!" })
            return;
        }

    } catch (e) {
        console.log("Неверный токен!", e.message)
        res.status(401).json({ message: "Неверный токен!" })
    }

    req.body.teacher_id = data.id


    try {
        methods = []
        var tempLocation = path.join(__dirname, '..', 'temp');

        const IMAGE_TYPES = "png;jpg;jpeg"
        const TEXT_TYPES = "txt;c;h;cpp;cs;java;json;js;php;py;asm;sql;html;xml;yaml;md"
        const DOC_TYPES = "xlsx;xlsm;xlsb;xlam;xltx;xltm;xls;xlt;xla;xlm;xlw;odc;ods;prn;csv;dsn;mdb;mde;accdb;accde;dbc;iqy;dqy;rqy;oqy;cub;atom;atomsvc;dbf;xll;xlb;slk;dif;xlk;bak;pptx;ppt;pptm;ppsx;pps;ppsm;potx;pot;potm;odp;thmx;docx;docm;doc;ppam;ppa;docx;docm;dotx;dotm;doc;odt;docx;docm;doc;dotx;dotm;dotx;dotm;rtf;odt;doc;wpd;doc";

        req.body.methods.forEach((item) => {
            item.type = item.name.indexOf(".") < 0 ? "" : (/\.([0-9a-z]+)(?:[\?#]|$)/.exec(item.name)[0].toLocaleLowerCase());

            var extension = item.type.substring(1)
            item.extension = extension

            var isAllowedType = false;

            if (DOC_TYPES.split(";").indexOf(extension) != -1)
                isAllowedType = true;

            if (IMAGE_TYPES.split(";").indexOf(extension) != -1)
                isAllowedType = true;

            if (TEXT_TYPES.split(";").indexOf(extension) != -1) {
                isAllowedType = true;
                item.name = item.name + ".txt"
                item.extension = "txt"
                item.type = ".txt"
            }

            if (extension == "pdf")
                isAllowedType = true;

            if (isAllowedType)
                methods.push(item)
        })


        var tempName = generateTempName();

        fs.mkdir(path.join(tempLocation, tempName), (err) => { })


        const constFinishedSave = async () => {
            console.log("methods", methods)

            req.body.methods = methods
            req.body.date = new Date(req.body.date)
            req.body.group = getGroupsArray(req.body.group)

            console.log("add_task data added", req.body)

            var task = new Task(req.body);

            var success = true


            await task.save()
                .then(function (doc) { })
                .catch(function (err) {
                    res.status(502).json({ message: "Ошибка в БД!" })
                    console.log("add_task data err:", err)
                    success = false
                });

            if (!success) {
                res.status(503).json({ message: "Ошибка в БД!" })
                return;
            }

            let groups = req.body.group
            let users = []

            for (let i = 0; i < groups.length; i++) {
                console.log()
                let user = await User.find({ Sym_group: groups[i] }, function (err, obj) {
                    if (err) console.log(err)
                })
                users = users.concat(user)

            }
            console.log("USERS", users)
            for (let i = 0; i < users.length; i++) {
                var solution = new Solution({
                    user_id: users[i].NSTU_Id, task_id: task._id, timeCreated: new Date(), timeSubmited: null, timeChecked: null,
                    status: 0, file:{}
                })
                console.log("SOLUTION", solution)
                await solution.save()
            }


        }


        const convNextFile = async (i) => {
            if (i >= req.body.methods.length) {
                constFinishedSave()
                return;
            }
            console.log("convNextFile changes files")
            const item = methods[i];
            var uri = item.uri
            var oldname = item.name
            var oldtype = /\.([0-9a-z]+)(?:[\?#]|$)/.exec(oldname)[0].toLocaleLowerCase();
            var newname = generateTempName();
            var extension = item.extension

            var newFilePath = path.join(tempLocation, tempName, newname + oldtype)


            await downloadFile(uri, newFilePath)

            item.path = "https://sd.randgor.ru/temp/" + tempName + "/" + newname + oldtype
            item.uri = null

            methods[i] = item
            convNextFile(i + 1)
        }

        convNextFile(0)

    } catch (e) {
        console.log("@message ", e.message)
        res.status(501).json({ message: "Ошибка сервера!" })
    }

    res.status(200).json({ data: { message: "Задание создано" } })
})









router.put("/task_list", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        let string = ''
        string = 'access_token_cookie=' + req.body.access_token_cookie + ';' + 'refresh_token_cookie=' + req.body.refresh_token_cookie
        let response = await fetch(`https://api.ciu.nstu.ru/v1.1/student/get_data/app/get_student_info`, {
            method: 'get',
            credentials: "same-origin",
            headers: {
                cookie: string
            },
        })
        if (response.ok) {
            let json = await response.json()
            const docs = await Task.find({ group: json[0].ID_GROUP }, function (err, docs) {
                if (err) return console.log(err)
            })
            if (docs == [])
                res.status(200).json({ message: "Список пуст!" })
            else
                res.status(200).json({ data: docs })
        }
        else {
            res.status(401).json({ message: "Токен не валидный" })
        }
    } catch (e) {
        console.log(e.message)
        res.status(401).json({ message: "Неверный токен!" })
    }
})

router.put("/solutions_list", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    try {
        /*if (true) {
            var mock = [
                { id: 7, title: 'сисан лялялялля №3', description: 'вы никогда не сдадите ewfiuwegfiewgewugeiwufgeiwubgiuewbguibwegewughiewuhgiewhgewgiewgiewugiewugiewgpewgbpewhgpoewugpouewgpouwegopuwegpwuegpuiewgewubjbfluewibgiweg', date: new Date(), time: '15:00', methods: [{ name: 'metoda.pdf', path: 'https://sd.randgor.ru/temp/i8pwvotdi3fppus9cd1yyt18cftupb.pdf' }, { name: 'trebovaniya.doc', path: 'https://sd.randgor.ru/temp/i8pwvotdi3fppus9cd1yyt18cftupb.pdf' }], file: { name: 'mysolve.doc', path: 'https://sd.randgor.ru/temp/i8pwvotdi3fppus9cd1yyt18cftupb.pdf' }, status: 1 },
                { id: 8, title: 'сисан №4', description: 'вы никогдаа', date: new Date(), time: '17:30', methods: [{ name: 'example.doc', path: 'https://sd.randgor.ru/temp/i8pwvotdi3fppus9cd1yyt18cftupb.pdf' }], file: { name: 'mysolve.doc', path: 'https://sd.randgor.ru/temp/i8pwvotdi3fppus9cd1yyt18cftupb.pdf' }, status: 1 },
                { id: 9, title: 'сисан №9', description: 'вы можете уже??', date: new Date(), time: '18:30', methods: [{ name: 'example2.doc', path: 'https://sd.randgor.ru/temp/i8pwvotdi3fppus9cd1yyt18cftupb.pdf' }], file: {}, status: 0 }
            ]

            res.status(200).json({ data: mock })
            return;
        }*/

        var data = await getIsStudentAndId({ access_token_cookie: req.body.access_token_cookie, refresh_token_cookie: req.body.refresh_token_cookie })


        const docs = await Solution.find({ user_id: data.id }, function (err, docs) {
            if (err) return console.log(err)
        })

        let i = 0
        let title
        let result = []

        for (let i = 0; i < docs.length; i++) {
            title = await Task.find({ _id: docs[i].task_id }, function (err, docsss) {
                if (err) return console.log(err)
            })
            console.log("@got title", title)
            let field = {}
            field._id = docs[i]._id
            field.user_id = docs[i].user_id
            field.task_id = docs[i].task_id
            field.timeCreated = docs[i].timeCreated
            field.timeSubmited = docs[i].timeSubmited
            field.timeChecked = docs[i].timeChecked
            field.status = docs[i].status
            field.file = docs[i].file
            field.title = title[0].title
            field.description = title[0].description
            field.methods = title[0].methods
            field.date = title[0].date
                
            result.push(field)
        }

        
        res.status(200).json({ data: result })
    } catch (e) {
        console.log("Неверный токен!", e)
        res.status(401).json({ message: "Неверный токен!" })
    }
})

router.put("/executed_list", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)
    var data;
    try {
        data = await getIsStudentAndId({ access_token_cookie: req.body.access_token, refresh_token_cookie: req.body.refresh_token })

        if (data.isStudent) {
            res.status(400).json({ message: "Вы не преподаватель, чтобы проверять задания!" })
            return;
        }

    } catch (e) {
        console.log("Неверный токен!", e.message)
        res.status(401).json({ message: "Неверный токен!" })
    }

    var tasks = await Task.find({teacher_id:data.id},function(err){
        if(err) {
            console.log(err)
            res.status(501).json({message:"Ошибка базы данных!"})
        }
    })

    var result = []
    
    let string
    for(let i=0;i<tasks.length;i++){

        var solution = await Solution.find({task_id:tasks[i]._id,status:1},function(err){
            if(err) {
                console.log(err)
                res.status(501).json({message:"Ошибка базы данных!"})
            }
        })
        
        for(let j=0;j<solution.length;j++){
            let result_obj ={}
            string  = JSON.parse(JSON.stringify(solution[j]))

            let user = await User.find({NSTU_Id:solution[j].user_id},function(err){
                if(err) {
                    console.log(err)
                    res.status(501).json({message:"Ошибка базы данных!"})
                }
            })

            result_obj.task_id = solution[j].task_id
            result_obj.solution_id = solution[j]._id
            result_obj.timeSubmited = solution[j].timeSubmited
            result_obj.title=tasks[i].title
            result_obj.description=tasks[i].description
            result_obj.file = string.file
            result_obj.student_name = user[0].Surname + ' ' + user[0].Name + ' ' + user[0].Lastname
            result_obj.group = user[0].Sym_group

            result.push(result_obj)
        }
        
    }
    return res.json(result)
})

router.post("/upload_solution", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)

    var data
    try{
        data = await getIsStudentAndId({ access_token_cookie: req.body.access_token, refresh_token_cookie: req.body.refresh_token })
    }catch(ex){
        res.status(401).json({ message: "Неверный токен!" })
        return
    }

    files = []
    var tempLocation = path.join(__dirname, '..', 'temp');

    const IMAGE_TYPES = "png;jpg;jpeg"
    const TEXT_TYPES = "txt;c;h;cpp;cs;java;json;js;php;py;asm;sql;html;xml;yaml;md"
    const DOC_TYPES = "xlsx;xlsm;xlsb;xlam;xltx;xltm;xls;xlt;xla;xlm;xlw;odc;ods;prn;csv;dsn;mdb;mde;accdb;accde;dbc;iqy;dqy;rqy;oqy;cub;atom;atomsvc;dbf;xll;xlb;slk;dif;xlk;bak;pptx;ppt;pptm;ppsx;pps;ppsm;potx;pot;potm;odp;thmx;docx;docm;doc;ppam;ppa;docx;docm;dotx;dotm;doc;odt;docx;docm;doc;dotx;dotm;dotx;dotm;rtf;odt;doc;wpd;doc";

    req.body.files.forEach((item) => {
        item.type = item.name.indexOf(".") < 0 ? "" : (/\.([0-9a-z]+)(?:[\?#]|$)/.exec(item.name)[0].toLocaleLowerCase());

        var extension = item.type.substring(1)
        item.extension = extension

        var isAllowedType = false;

        if (DOC_TYPES.split(";").indexOf(extension) != -1)
            isAllowedType = true;

        if (IMAGE_TYPES.split(";").indexOf(extension) != -1)
            isAllowedType = true;

        if (TEXT_TYPES.split(";").indexOf(extension) != -1) {
            isAllowedType = true;
            item.name = item.name + ".txt"
            item.extension = "txt"
            item.type = ".txt"
        }

        if (extension == "pdf")
            isAllowedType = true;

        if (isAllowedType)
            files.push(item)
    })

    if (files.length == 0) {
        res.status(400).json({ message: "Нет доступных для отправки файлов" })
        return 0;
    }

    if (files.length > 1) {
        res.status(400).json({ message: "Отправлено более 1 файла" })
        return 0;
    }

    var tempName = generateTempName();

    fs.mkdir(path.join(tempLocation, tempName), (err) => { })

    const item = files[0];

    var uri = item.uri
    var oldname = item.name
    var oldtype = /\.([0-9a-z]+)(?:[\?#]|$)/.exec(oldname)[0].toLocaleLowerCase();
    var newname = generateTempName();
    var extension = item.extension

    var newFilePath = path.join(tempLocation, tempName, newname + oldtype)


    await downloadFile(uri, newFilePath)

    let solution_send ={name: newname + oldtype, path: "https://sd.randgor.ru/temp/" + tempName + "/" + newname + oldtype}
    
    await Solution.findOneAndUpdate({user_id:data.id},{file:solution_send,status:1,timeSubmited:new Date()},function(err,obj){
        if(err){
            console.log("ERROR update solution",err)
            res.status(502).json({ err:err,message: "Ошибка в БД!" })
        }
    })


    res.status(200).json({ data: { solution_send:solution_send, name: newname + oldtype, size: 0, path: "https://sd.randgor.ru/temp/" + tempName + "/" + newname + oldtype } })
})

router.post("/upload_validation", jsonParser, async function (req, res, next) {
    if (!req.body) return res.sendStatus(400)

    var data;
    try {
        data = await getIsStudentAndId({ access_token_cookie: req.body.access_token, refresh_token_cookie: req.body.refresh_token })

        if (data.isStudent) {
            res.status(400).json({ message: "Вы не преподаватель, чтобы проверять задания!" })
            return;
        }

    } catch (e) {
        console.log("Неверный токен!", e.message)
        res.status(401).json({ message: "Неверный токен!" })
    }

    var newStatus = req.body.conclusion? 2: 0
    var solution_id = req.body.solution_id
    await Solution.findByIdAndUpdate(solution_id,{status:newStatus},function(err,obj){
        if(err) {
            res.status(505).json({err:err, solution_id:solution_id, newStatus:newStatus, message:"Ошибка базы данных!"})
            return;
        }
    })
    res.status(200).json({ data: { solution_id:solution_id, status:newStatus, message: "Задание обновлено" } })
})


async function writeFileSure2(fileName, fileData) {
    try {
        fs.writeFileSync(fileName, fileData);
    } catch (ex) {
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log("error when write, try again")
        await writeFileSure2(fileName, fileData)
    }
}

async function writeFileSure3(fileName, fileData, fileMimeCode) {
    try {
        fs.writeFileSync(fileName, fileData, fileMimeCode);
    } catch (ex) {
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log("error when write, try again")
        await writeFileSure3(fileName, fileData, fileMimeCode)
    }
}

async function downloadFile(uri, filename) {
    var base64Data = uri.split(',')[1];
    var mimeCode = uri.split(',')[0].split(':')[1].split(';')[1];

    if (!base64Data) base64Data = ""

    if (!mimeCode) mimeCode = "base64"

    await writeFileSure3(filename, base64Data, mimeCode)
};


function generateTempName() {
    var out = ""
    while (out.length < 30)
        out += Math.random().toString(36).substring(2);
    return out.substring(0, 30)
}


router.post("/upload", jsonParser, async function (req, res, next) {
    files = []
    var tempLocation = path.join(__dirname, '..', 'temp');

    const IMAGE_TYPES = "png;jpg;jpeg"
    const TEXT_TYPES = "txt;c;h;cpp;cs;java;json;js;php;py;asm;sql;html;xml;yaml;md"
    const DOC_TYPES = "xlsx;xlsm;xlsb;xlam;xltx;xltm;xls;xlt;xla;xlm;xlw;odc;ods;prn;csv;dsn;mdb;mde;accdb;accde;dbc;iqy;dqy;rqy;oqy;cub;atom;atomsvc;dbf;xll;xlb;slk;dif;xlk;bak;pptx;ppt;pptm;ppsx;pps;ppsm;potx;pot;potm;odp;thmx;docx;docm;doc;ppam;ppa;docx;docm;dotx;dotm;doc;odt;docx;docm;doc;dotx;dotm;dotx;dotm;rtf;odt;doc;wpd;doc";

    console.log("====SAVE")

    req.body.data.forEach((item) => {
        item.type = item.name.indexOf(".") < 0 ? "" : (/\.([0-9a-z]+)(?:[\?#]|$)/.exec(item.name)[0].toLocaleLowerCase());

        var extension = item.type.substring(1)
        item.extension = extension

        var isAllowedType = false;

        if (DOC_TYPES.split(";").indexOf(extension) != -1)
            isAllowedType = true;

        if (IMAGE_TYPES.split(";").indexOf(extension) != -1)
            isAllowedType = true;

        if (TEXT_TYPES.split(";").indexOf(extension) != -1) {
            isAllowedType = true;
            item.name = item.name + ".txt"
            item.extension = "txt"
            item.type = ".txt"
        }

        if (extension == "pdf")
            isAllowedType = true;

        if (isAllowedType)
            files.push(item)
    })

    if (files.length == 0) {
        res.status(400).json({ message: "Нет доступных для конвертации файлов" })
        return 0;
    }

    var tempName = generateTempName();

    fs.mkdir(path.join(tempLocation, tempName), (err) => { })

    console.log("====CONV")

    const convNextFile = async (i) => {
        if (i >= files.length) {
            convMergeFiles()
            return;
        }

        const item = files[i];

        var uri = item.uri
        var oldname = item.name
        var oldtype = /\.([0-9a-z]+)(?:[\?#]|$)/.exec(oldname)[0].toLocaleLowerCase();
        var newname = generateTempName();
        var extension = item.extension

        var newFilePath = path.join(tempLocation, tempName, newname + oldtype)


        await downloadFile(uri, newFilePath)

        if (TEXT_TYPES.split(";").indexOf(extension) != -1) {
            console.log(oldname, "текст!", "=>", newname)

            var textInFile = fs.readFileSync(newFilePath, "utf-8")

            const stream = fs.createWriteStream(newFilePath + '.pdf')

            const doc = new PDFDocument();
            doc.registerFont('Times', path.join(__dirname, '..', 'fonts/times.ttf'))
            doc.pipe(stream);
            doc.font('Times').fontSize(14).text(textInFile)
            doc.end();

            item.newname = newname + oldtype + ".pdf"

            stream.on('finish', () => convNextFile(i + 1));
        } else if (IMAGE_TYPES.split(";").indexOf(extension) != -1) {
            console.log(oldname, "фото!", "=>", newname)

            const dimensions = sizeOf(newFilePath)

            const stream = fs.createWriteStream(newFilePath + '.pdf')

            const doc = new PDFDocument({ autoFirstPage: false });
            doc.pipe(stream);
            doc.addPage({ size: [dimensions.width, dimensions.height] });
            doc.image(newFilePath, 0, 0)
            doc.end();

            item.newname = newname + oldtype + ".pdf"

            stream.on('finish', () => convNextFile(i + 1));
        } else if ("pdf" == extension) {
            console.log(oldname, "is already pdf")

            item.newname = newname + oldtype
            convNextFile(i + 1)
        } else {
            console.log(oldname, "format!", "=>", newname)

            var convStatus = await fileConvert.convert({
                sourceFile: newFilePath,
                outputFile: newFilePath + ".pdf",
            })


            if (convStatus == null) {
                console.log("Не удалось конвертировать файл", newFilePath)
                res.status(400).json({ message: "Не удалось конвертировать файл" })
                return 0;
            }


            item.newname = newname + oldtype + ".pdf"
            convNextFile(i + 1)
            files[i] = item
        }
    }

    const convMergeFiles = async () => {
        console.log("====MERG")

        const pdfDoc = await pdfLib.PDFDocument.create()

        for (const item of files) {
            var fpath = path.join(tempLocation, tempName, item.newname)

            const donorPdfDoc = await pdfLib.PDFDocument.load(fs.readFileSync(fpath))
            const donorPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());

            donorPages.forEach((page) => pdfDoc.addPage(page));
        }

        const pdfBytes = await pdfDoc.save()

        console.log("====RSLT")

        await writeFileSure2(path.join(tempLocation, tempName + ".pdf"), pdfBytes)

        res.status(200).json({ data: { name: tempName + ".pdf", size: pdfBytes.length, path: "https://sd.randgor.ru/temp/" + tempName + ".pdf" } })
        //res.status(200).json({ data: {name: tempName + ".pdf", size: pdfBytes.length, path: "http://192.168.1.8:5000/temp/" + tempName + ".pdf"} })
    }

    convNextFile(0);
})


module.exports = router