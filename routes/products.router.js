const express = require('express');
const router = express.Router();
const Product = require('../models/products.model');
const Category = require('../models/category.model');
const multer  = require('multer');
const mongoose = require('mongoose')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
      cb(uploadError, 'uploads/image')
    },
    filename: function (req, file, cb) {
      //const fileName = req.body.name.split(' ').join('-');
	const fileName = `${file.fieldname}-product`
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })

  const storageGallery = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
      cb(uploadError, 'uploads/image')
    },
    filename: function (req, file, cb) {
      const fileName = `${file.fieldname}-gallery` ;
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })


const uploadGalleryOptions = multer({ storage: storageGallery })
const uploadOptions = multer({ storage: storage })


router.get('/', async (req, res)=> {
    let filter = {}
    if(req.query.categories){
        filter = { category: req.query.categories.split(',')}
    }

    const productList = await Product.find(filter);
    
    if(!productList) {
        res.status(500).json({success: false})
    } 
    res.send(productList)
})

router.get(`/:id`, (req, res) =>{
    Product.findById(req.params.id).populate('category').then(product => {
        if(product)
            return res.status(200).send(product)
        else 
            return res.status(404).json({
                success: false,
                message: "product not found"
            })
    })
    .catch(err => {
         return res.status(400).json({
            success: false,
            error: err
        })
    })
})

router.get(`/get/count`, async (req, res) =>{
    const productCount = await Product.countDocuments(count => count);
    
        if(!productCount)
            res.status(500).json({
                success: false,
                message: "An error has occurred, please try again!"
            })    
        res.status(200).send({
            productCount: productCount
        })
})

router.get(`/get/featured/:count`, async (req, res) =>{
    const count = req.params.count ? req.params.count : 0;

    const productFeatured = await Product.find({
        isFeatured: true
    }).limit(+count);
    
        if(!productFeatured)
            res.status(500).json({
                success: false,
                message: "An error has occurred, please try again!"
            })    
        res.status(200).send(productFeatured)
})

router.post('/', uploadOptions.single('image'), async (req, res)=> {
    const categoryValidate = await Category.findById(req.body.category)
    if(!categoryValidate)
    return res.status(500).send('Invalid category!')

    const file = req.file;
    if(!file) return res.status(400).send('No image in the request')

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/uploads/image/`

    const { 
        name, 
        description, 
        richDescription, 
        brand, 
        price, 
        category, 
        countInStock, 
        rating, 
        numReviews, 
        isFeatured  
    } = req.body;

    const product = new Product({
        name: name, 
        description: description, 
        richDescription: richDescription, 
        image: `${basePath}${fileName}`, 
        brand: brand, 
        price: price, 
        category: category, 
        countInStock: countInStock, 
        rating: rating, 
        numReviews: numReviews, 
        isFeatured: isFeatured,  
    })
    product.save()
        .then(createdProduct => {
            res.status(201).json(createdProduct)
        })
        .catch(err => {
            res.status(500).json({
                error: err,
                success: false
            })
        })
})

router.put('/:id', async (req, res) => {
    const categoryValidate = await Category.findById(req.body.category)
    if(!categoryValidate)
    return res.status(500).send('Invalid category!')

    const { name, 
        description, 
        richDescription, 
        image, 
        images, 
        brand, 
        price, 
        category, 
        countInStock, 
        rating, 
        numReviews, 
        isFeatured  
    } = req.body;

    Product.findByIdAndUpdate(req.params.id, {
        name: name, 
        description: description, 
        richDescription: richDescription, 
        image: image, 
        images: images, 
        brand: brand, 
        price: price, 
        category: category, 
        countInStock: countInStock, 
        rating: rating, 
        numReviews: numReviews, 
        isFeatured: isFeatured, 
    }, 
    { new: true })
    .then(product => {
        return res.status(200).json({
            success: true,
            message: "the product was updated succesfully",
            product: product
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

router.put(
    '/gallery-images/:id', 
    uploadGalleryOptions.array('images', 10), 
    async (req, res)=> {
        if(!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id')
         }
         const files = req.files
         let imagesPaths = [];
         const basePath = `${req.protocol}://${req.get('host')}/uploads/image/`;

         if(files) {
            files.map(file =>{
                imagesPaths.push(`${basePath}${file.filename}`);
            })
         }

         const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            { new: true }
        )

        if(!product)
            return res.status(500).send('the gallery cannot be updated!')

        res.send(product);
    }
)


router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if(product) {
            return res.status(200).json({
                success: true,
                message: 'the product was deleted!'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: "product not found"
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
