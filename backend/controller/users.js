import Users from "../models/userModel.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";


export const getUsers = async(req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ['id', 'name', 'email', 'nim']
        });
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

export const Register = async(req, res) => {
    const { name, email, nim, password, confPassword} = req.body;
    if(password !== confPassword) return res.status(400).json({msg: "Password tidak sama"});
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({
            name: name,
            email: email,
            nim: nim,
            password: hashPassword
        });
        res.json({msg: "Register berhasil"});
    } catch (error) {
        console.log(error);
    }
}

export const Login = async(req, res) => {
    try {
        const user = await Users.findAll({
            where:{
                [Op.or]: [
                    { email: req.body.username }, 
                    { nim: req.body.username } 
                ]
            }
        });
        if (user.length === 0) {
            return res.status(404).json({ msg: "Email atau NIM tidak ditemukan" });
        }
        // const matchEmail = await bcrypt.compare(req.body.email, user[0].email);
        // if(!matchEmail) return res.status(400).json({msg: "Email tidak ditemukan"});
        // const matchNim = await bcrypt.compare(req.body.nim, user[0].nim);
        // if(!matchNim) return res.status(400).json({msg: "NIM tidak ditemukan"});
        const matchPw = await bcrypt.compare(req.body.password, user[0].password);
        if(!matchPw) return res.status(400).json({msg: "Password salah"});
        const userId = user[0].id;
        const name = user[0].name;
        const email = user[0].email;
        const nim = user[0].nim;
        const accessToken = jwt.sign({userId, name, email, nim}, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '20s'
        });
        const refreshToken = jwt.sign({userId, name, email, nim}, process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '1d'
        });
        await Users.update({refresh_tokens: refreshToken},{
            where:{
                id: userId
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            // secure: true //nonaktif krn local
        });
        res.json({ accessToken});
    } catch(error) {
        console.error("Login Error:", error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
}

export const logout = async(req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.sendStatus(204);
    const user = await Users.findAll({
        where: {
            refresh_tokens: refreshToken
        }
    });
    if(!user[0]) return res.sendStatus(204);
    const userId = user[0].id;
    await Users.update({refresh_tokens: null}, {
        where:{
            id: userId
        }
    });
    res.clearCookie('refreshToken');
    return res.sendStatus(200);
}