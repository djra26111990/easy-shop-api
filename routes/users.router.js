const User = require('../models/user.model');
const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
require('dotenv').config();


router.get(`/`, async (req, res) =>{
    const userList = await User.find().select('-passwordHash');

    if(!userList) {
        res.status(500).json({success: false})
    } 
    res.send(userList);
})

router.get(`/:id`, (req, res) =>{
    User.findById(req.params.id).select('-passwordHash').then(user => {
        if(user)
            return res.status(200).send(user)
        else 
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
    })
    .catch(err => {
         return res.status(400).json({
            success: false,
            error: err
        })
    })
})

router.post('/', (req, res)=> {
    const saltRounds = 10;
    const { 
        name,
        email,
        password,
        phone,
        street,
        apartment,
        city,
        zip,
        country,
        isAdmin  
    } = req.body;

    const user = new User({
        name: name,
        email: email,
        passwordHash: bcryptjs.hashSync(password, saltRounds),
        phone: phone,
        street: street,
        apartment: apartment,
        city: city,
        zip: zip,
        country: country,
        isAdmin: isAdmin,  
    })
    user.save()
        .then(createdUser => {
            res.status(201).json(createdUser)
        })
        .catch(err => {
            res.status(500).json({
                error: err,
                success: false
            })
        })
})

router.post(`/login`, async (req, res) => {
    const user = await User.findOne({
        email: req.body.email
    })
    const secret = process.env.SECRET;

    if(!user) {
        return res.status(400).send('the user is not found');
    }

    if(user && bcryptjs.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {
                expiresIn: '1d'
            }
        )
        res.status(200).send({
            user: user.email,
            token: token
        })
    } else {
        res.status(500).send('Password incorrect!')
    }
})

router.post('/register', (req, res)=> {
    const saltRounds = 10;
    const { 
        name,
        email,
        password,
        phone,
        street,
        apartment,
        city,
        zip,
        country,
        isAdmin  
    } = req.body;

    const user = new User({
        name: name,
        email: email,
        passwordHash: bcryptjs.hashSync(password, saltRounds),
        phone: phone,
        street: street,
        apartment: apartment,
        city: city,
        zip: zip,
        country: country,
        isAdmin: isAdmin,  
    })
    user.save()
        .then(createdUser => {
            res.status(201).json(createdUser)
        })
        .catch(err => {
            res.status(500).json({
                error: err,
                success: false
            })
        })
})

router.get(`/get/count`, async (req, res) =>{
    const UserCount = await User.countDocuments(count => count);
    
        if(!UserCount)
            res.status(500).json({
                success: false,
                message: "An error has occurred, please try again!"
            })    
        res.status(200).send({
            UserCount: UserCount
        })
})

router.put('/:id', (req, res) => {
    
    const saltRounds = 10;
    const { 
        name,
        email,
        password,
        phone,
        street,
        apartment,
        city,
        zip,
        country,
        isAdmin  
    } = req.body;

    User.findByIdAndUpdate(req.params.id, {
        name: name,
        email: email,
        passwordHash: bcryptjs.hashSync(password, saltRounds),
        phone: phone,
        street: street,
        apartment: apartment,
        city: city,
        zip: zip,
        country: country,
        isAdmin: isAdmin,  
    }, 
    { new: true })
    .then(user => {
        return res.status(200).json({
            success: true,
            message: "the user was updated succesfully",
            user: user
        })
    })
    .catch(err => {
        return res.status(500).json({
            success: false,
            message: "has occurred some error, please try again",
            error: err
        })
    })
})

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if(user) {
            return res.status(200).json({
                success: true,
                message: 'the user was deleted!'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            error: err
        })
    })
})


module.exports = router;