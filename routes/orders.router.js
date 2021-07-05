const Order = require('../models/order.model');
const express = require('express');
const router = express.Router();
const OrderItem = require('../models/orderItem.model')

router.get(`/`, async (req, res) =>{
    const orderList = await Order.find()
    .populate('user', 'name')
    .populate({
        path: 'orderItems',
        populate: {
            path: 'product',
            populate: 'category'
        }
    })
    .sort({'dateOrdered': -1});

    if(!orderList) {
        res.status(500).json({success: false})
    } 
    res.send(orderList);
})

router.get(`/:id`, (req, res) =>{
    Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({
        path: 'orderItems',
        populate: {
            path: 'product',
            populate: 'category'
        }
    })
    .then(order => {
        if(order)
            return res.status(200).send(order)
        else 
            return res.status(404).json({
                success: false,
                message: "order not found"
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

    const { 
        shippingAddress1,
        shippingAddress2,
        city,
        zip,
        country,
        phone,
        status,
        user
     } = req.body;

    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) =>{
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a,b) => a + b , 0);

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: shippingAddress1,
        shippingAddress2: shippingAddress2,
        city: city,
        zip: zip,
        country: country,
        phone: phone,
        status: status,
        totalPrice: totalPrice,
        user: user,
    })

    order = await order.save();

    if(!order)
    return res.status(400).send('the order cannot be created!')

    res.send(order);
})

router.put('/:id', (req, res) => {
    const { status } = req.body;
    
    Order.findByIdAndUpdate(req.params.id, { 
        status: status  
    }, 
    { new: true })
    .then(order => {
        return res.status(200).json({
            success: true,
            message: "the order was updated succesfully",
            order: order
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

router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Order.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})
})

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Order.countDocuments((count) => count)

    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})




module.exports = router;