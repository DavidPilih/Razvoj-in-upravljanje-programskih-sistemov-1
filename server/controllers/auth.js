const StudentModel = require("../models/Student")


async function register(req, res){
    try  {
        const { username, password, firstName, lastName, nickname, grade, classLabel } = req.body;
        await StudentModel.create({username, password, firstName, lastName, nickname, grade, classLabel})
        res.status(201);
        res.json("ok");
        return;
    }   
    catch(err){
        res.status(400);
        res.json(err);
    }
}

async function login(req, res){
    try  {
        const { username, password, firstName, lastName, nickname, grade, classLabel } = req.body;
        await StudentModel.create({username, password, firstName, lastName, nickname, grade, classLabel})
        res.status(201);
        res.json("ok");
        return;
    }   
    catch(err){
        res.status(400);
        res.json(err);
    }
}



module.exports =  {register}