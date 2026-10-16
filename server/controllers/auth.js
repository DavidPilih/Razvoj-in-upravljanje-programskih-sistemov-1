const StudentModel = require("../models/Student")
const mongoose = require("mongoose")

async function register(req, res){
    try  {
        const { username, password, firstName, lastName, nickname, grade, classLabel } = req.body;
        await StudentModel.create({username, password, firstName, lastName, nickname, grade, classLabel})
        res.status(201);
        res.json("ok");
        return;
    }   
    catch(err){
        res.status(500);
        res.json(err);
    }
}

async function login(req, res){
    try{
        const user = await StudentModel.findOne({username: req.body.username}).select("+password")
        if(!user) {
            res.status(400);
            res.json("wrong username")
            return;
        }
        const password_ok = await user.comparePassword(req.body.password);
        if(!password_ok) {
            res.status(400);
            res.json("wrong password")
            return;
        }
        req.session.student_id = user.id;
        res.status(200);
        res.json(user);
    }catch(err){
        res.status(500)
        res.json(err)
    }
}

async function deleteUser(req, res){
    try{
        await StudentModel.deleteOne({username: req.body.username})
        res.status(200);
        res.json("delition ok");
    }catch(err){
        res.status(500)
        res.json(err)
    }
}


module.exports =  {deleteUser, login, register}