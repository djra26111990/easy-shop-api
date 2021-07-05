const Category = require('../models/category.model');
const express = require('express');
const router = express.Router();


router.get(`/`, async (req, res) =>{
    const categoryList = await Category.find();

    if(!categoryList) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(categoryList);
})

router.get(`/:id`, (req, res) =>{
    Category.findById(req.params.id).then(category => {
        if(category)
            return res.status(200).send(category)
        else 
            return res.status(404).json({
                success: false,
                message: "category not found"
            })
    })
    .catch(err => {
         return res.status(400).json({
            success: false,
            error: err
        })
    })
})

router.post('/', async (req, res)=> {
    const { name, color, icon, image } = req.body;

    let category = new Category({
        name: name,
        color: color,
        icon: icon,
        image: image
    })

    category = await category.save();

    if(!category)
        return res.status(500).send('the category cannot be created');
    res.status(201).send(category)
})

router.put('/:id', (req, res) => {
    const { name, color, icon, image } = req.body;
    
    Category.findByIdAndUpdate(req.params.id, {
        name: name,
        color: color,
        icon: icon,
        image: image
    }, 
    { new: true })
    .then(category => {
        return res.status(200).json({
            success: true,
            message: "the category was updated succesfully",
            category: category
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
    Category.findByIdAndRemove(req.params.id).then(category => {
        if(category) {
            return res.status(200).json({
                success: true,
                message: 'the category is deleted!'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: "category not found"
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