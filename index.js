const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require("cors");
const fs = require('fs');
const bodyParser = require('body-parser');
// var jwt = require('jsonwebtoken');
var admin = require("firebase-admin");
// const stripe = require("stripe")(process.env.PAYMENT_SECRETKEY)
const stripe = require("stripe")("sk_test_51Os6QHAQkbe9BvrZeNfp4n4Y2J0hpbWfUl4VmLtYXtVTAkPk8wLsGDdStCl0byDdl5UzGpKzvADbzoHofu5uPF7C00kWw9aWjb")
var serviceAccount = require("./public/mbb-e-commerce-firebase-adminsdk-jcum3-7d69c2b6db.json");








// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: 'hasnatoooooooo@gmail.com', // Your Gmail email address
//     clientId: '862564797662-83jmang95acvqdnlhpmh66tga87pm44j.apps.googleusercontent.com',
//     clientSecret: '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',
//     refreshToken: '1//05r2Evq-J7MeICgYIARAAGAUSNwF-L9IrPQE1-iWAIHgMINjAH96PPXD63IzvbqVs0-9r5_Kii6A3Os6pRjHPGRyBjp2XCUORltg'
//   }
// });





const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: 'webdev206804@gmail.com', // Your Gmail email address
    pass: "zujb aejk tebo wans"
  }
});



const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config()
const app = express();
// const stripe = require("stripe")(process.env.PAYMENT_SECRETKEY)
const port = process.env.PORT || 8000;


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(bodyParser.json());

// Configure Cloudinary with your Cloud Name, API Key, and API Secret

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});





const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unthorized 1 user" })
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "unthorized 2 user" })
    }
    req.decoded = decoded;
    next()
  })
}

// Routes
// Define your routes here
app.get('/', (req, res) => {
  res.send("MBB-E-Commerce is running")
})

// if (process.env.NODE_ENV == "production") { 
//   // running on the Vercel platform.
//   console.log("process.env.NODE_ENV");
//   puppeteer = require('puppeteer-core');
// } else {
//   // running locally.
//   console.log(process.env.NODE_ENV);
//   puppeteer = require('puppeteer');
// }
const launchBrowser = async () => {

  try{
    if (process.env.NODE_ENV !== 'production') {
      console.log(process.env.NODE_ENV);
      const chromium = require('@sparticuz/chromium');
      console.log(await chromium.executablePath());
      chromium.setGraphicsMode = false;
      const puppeteer = require('puppeteer-core');
      browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
      });
  } else {
    console.log(process.env.NODE_ENV);
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({ headless: 'new' });
  }
  }
  catch(error){
    // res.status(500).json({error: error});
    throw new Error(error)
  }
};
const generatePDFFromHTML = async (htmlContent) => {
  let browser;
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const puppeteer = isDevelopment ? require('puppeteer') : require('puppeteer-core');
    
    if (isDevelopment) {
      // In development (your laptop), use normal Puppeteer
      browser = await puppeteer.launch();
    } else {
      // In production (AWS Lambda etc.), use chromium
      let chromium = require("@sparticuz/chromium");
      chromium.setGraphicsMode = false;
      browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({ format: 'A4' });

    await page.close();
    await browser.close();
    
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    throw new Error(`Failed to generate PDF: ${error}`);
  }
};

// const convertHtmlToPdf = async(htmlContent, outputPath) => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   await page.setContent(htmlContent);
//   await page.pdf({ path: outputPath, format: 'A4' });

//   await browser.close();
// }



// const generatePDFFromHTML = async (htmlContent) => {

//   try{
//    let browser;
//    if (process.env.NODE_ENV !== 'development') {
//      console.log(process.env.NODE_ENV);
//      const chromium = require('@sparticuz/chromium');
//      chromium.setGraphicsMode = false;
//      const puppeteer = require('puppeteer-core');
//       browser = await puppeteer.launch({
//          args: chromium.args,
//          defaultViewport: chromium.defaultViewport,
//          executablePath: await chromium.executablePath(),
//          headless: chromium.headless,
//      });
//  } else {
//    console.log(process.env.NODE_ENV);
//      const puppeteer = require('puppeteer');
//       browser = await puppeteer.launch({ headless: 'new' });
//  }
//    const page = await browser.newPage();
//    await page.setContent(htmlContent);
//    const pdfBuffer = await page.pdf({ format: 'A4' });
//    await page.close();
//    return pdfBuffer;
//   }
//   catch(error){
//    throw new Error(error)
//   }
//  };

// Function to send email with attachment
 const sendEmailWithAttachment = async(pdfBuffer, recipientEmail, htmlContent) => {
  

  let mailOptions = {
      from: 'hasnatoooooooo@gmail.com',
      to: recipientEmail,
      subject: 'Your order has been received',
      html: htmlContent,
      attachments: [{
        filename: 'order.pdf',
        content: pdfBuffer
    }]
  };

  try{
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sending info', info);
  }
  catch (err){
    console.log(err);
  }
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uf4d7tl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db('CholoBazar');
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const prisonsCollection = db.collection("prisons");
    const wishListCollection = db.collection("wish-list");
    const ordersCollection = db.collection("orders");
    const categoryCollection = db.collection("categories");
    const salesReportCollection = db.collection('sales-report');
    const bannerImageCollection = db.collection('bannar-images');
    const SystemSettingCollection = db.collection('system-settings');
    const taxAndShippingMethodCollection = db.collection('tax-shipping');
    const imageCollection = db.collection('image-collection');





    app.post('/uploadSingle', async (req, res) => {
      console.log(req.files);
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).send('No files were uploaded.');
        }

        const imageFile = req.files.file;
        if (!imageFile.data || !(imageFile.data instanceof Buffer)) {
          throw new Error('Invalid file data.');
        }

        const stream = Readable.from(imageFile.data);

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
          stream.pipe(uploadStream);
        });

        console.log('Image uploaded to Cloudinary:', result);
        res.json({ url: result.secure_url });
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        res.status(500).send('Internal server error');
      }
    });

    app.delete('/banner-image-delete/:id', async (req, res) => {
      try {
        const id = req.params.id

        const filter = { _id: new ObjectId(id) };
        const result = await bannerImageCollection.deleteOne(filter);

        res.send(result)
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/bannerImage', async (req, res) => {
      try {
        const { newImages } = req.body;

        if (!Array.isArray(newImages)) {
          return res.status(400).json({ message: 'Images should be an array' });
        }


        // Update the document and add the new images to the existing images array
        const result = await bannerImageCollection.updateOne({}, { $push: { images: { $each: newImages } } });

        res.send(result)
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/isWishListed/:id", async(req, res) => {
      const id = req.params.id;
      const result = await wishListCollection.findOne({"product._id": id})
      res.send(result)
    })

    app.get("/imageGet", async(req, res) => {
      const result = await imageCollection.find().toArray();
      res.send(result);
    })
    app.get("/demo", async(req, res) => {
      const result = {data: "Hello there"};
      res.send(result);
    })

    app.post("/imageUploader", async(req, res) => {
      const {imageUrl} = req.body;
      const result = await imageCollection.insertOne({imageUrl});
      res.send(result)
    })

    app.post("/contactWithUser", async(req, res) => {
      const {email, name, message} = req.body;
      let mailOptions = {
        from: email,
        to: 'hasnatoooooooo@gmail.com',
        subject: `New Message from ${name}`,
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Message</title>
        </head>
        <body>
           <h3>Hello,</h3>
           <h4 style="margin-bottom: 100px">You got a new message from ${name}-</h3>
           <br />
           <div style="background-color: #ddd; padding: 20px; border-radius: 5px; font-size: 18px; color: #000">
              <pre>${message}</pre>
              <br />
            <h3>Mailed by: ${email}</h3>
           </div>
           
        </body>
        </html>
        `,
    };
    let info = await transporter.sendMail(mailOptions);
    console.log(info);
    res.status(200).json({message: "email send successfull"})
    })


    app.get("/wish-list-by-email/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { addedBy: email };
      const result = await wishListCollection.find(filter).toArray();
      res.send(result)
    })

    app.delete("/deleteWishLish/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await wishListCollection.deleteOne(filter);
      res.send(result)
    })


    app.post("/wish-list", async (req, res) => {
      const wishItem = req.body;
      const result = await wishListCollection.insertOne(wishItem);
      res.send(result)
    })
    app.delete("/wish-list/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await wishListCollection.deleteOne(filter);
      res.send(result)
    })


    app.get("/system-setting", async (req, res) => {
      const result = await SystemSettingCollection.find().toArray();
      res.send(result)
    })


    app.patch("/system-setting-update/:id", async (req, res) => {
      const id = req.params.id;
      const { system_name, email, phone_number, logo } = req.body;
      console.log(req.body);
      const filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $set: {}
      };
      if (system_name) {
        updateDoc.$set.system_name = system_name;
      }
      if (email) {
        updateDoc.$set.email = email;
      }
      if (phone_number) {
        updateDoc.$set.phone_number = phone_number;
      }
      if (logo) {
        updateDoc.$set.logo = logo;
      }
      const result = await SystemSettingCollection.updateOne(filter, updateDoc);
      res.send(result)
    })


    app.post('/uploadMultiple', async (req, res) => {
      try {
        if (!req.files || !req.files.files || req.files.files.length === 0) {
          return res.status(400).json({ message: 'No files were uploaded.' });
        }

        let images = req.files.files;
        if (!Array.isArray(images)) {
          images = [images];
        }

        const uploadPromises = images.map(async (image) => {
          const imageStream = new Readable();
          imageStream.push(image.data);
          imageStream.push(null);

          const { secure_url } = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream((error, result) => {
              if (error) reject(error);
              else resolve(result);
            });
            imageStream.pipe(stream);
          });
          return secure_url;
        });

        const imageUrls = await Promise.all(uploadPromises);
        res.json({ imageUrls });
      } catch (error) {
        console.error('Error handling upload request:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });



    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, { expiresIn: '10h' });
      res.send({ token })
    })

    app.get("/productsLength", async (req, res) => {
      try {
        const productsCount = await productsCollection.countDocuments();
        res.json({ length: productsCount });
      } catch (error) {
        console.error("Error retrieving product count:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.get("/ordersLength", async (req, res) => {
      try {
        const ordersCount = await ordersCollection.countDocuments();
        res.json({ length: ordersCount });
      } catch (error) {
        console.error("Error retrieving product count:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });



    app.get('/sold-products-count-last-12-months', async (req, res) => {
      try {
        // Calculate the start date (first day of the current month 12 months ago)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11);
        startDate.setDate(1);
        // Calculate the end date (last day of the current month)
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        // Aggregate orders for the last 12 months
        const soldProductsLast12Months = await db.collection('orders').aggregate([
          {
            $match: {
              createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } // Filter orders within the last 12 months
            }
          },
          {
            $unwind: "$products" // Unwind the products array
          },
          {
            $group: {
              _id: {
                month: { $month: { $dateFromString: { dateString: "$createdAt" } } }, // Extract month from the date string
              },
              totalQuantity: { $sum: "$products.quantity" } // Sum the quantity of sold products
            }
          },
          {
            $sort: { "_id.month": 1 } // Sort by month
          }
        ]).toArray();

        // Construct response object with sold product count for each month of the last 12 months
        const soldProductsCountLast12Months = {};

        // Iterate over all 12 months
        for (let i = 0; i < 12; i++) {
          // Calculate the month for the current iteration
          const monthYearKey = new Date(startDate);
          monthYearKey.setMonth(startDate.getMonth() + i);
          const month = monthYearKey.toLocaleString('en-us', { month: 'short' });

          // Initialize the count for the current month to 0
          soldProductsCountLast12Months[month] = 0;
        }

        // Update counts for existing months
        soldProductsLast12Months.forEach(monthData => {
          const month = new Date(startDate);
          month.setMonth(monthData._id.month - 1);
          const monthName = month.toLocaleString('en-us', { month: 'short' });

          soldProductsCountLast12Months[monthName] = monthData.totalQuantity;
        });

        res.json(soldProductsCountLast12Months);
      } catch (error) {
        console.error('Error fetching sold products count for the last 12 months:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });



    app.get('/usersByRole', async (req, res) => {
      try {
        const userCounts = await usersCollection.aggregate([
          {
            $group: {
              _id: "$userRole",
              count: { $sum: 1 }
            }
          }
        ]).toArray();
        console.log("object", userCounts);
        const userCountByRole = userCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {});

        res.json(userCountByRole);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const addedBy = product?.addedBy;
      const filter = { _id: new ObjectId(addedBy) };
      const updateDoc = {
        $inc: { total_products: 1 }
      }
      const updateUser = await usersCollection.updateOne(filter, updateDoc);
      const result = await productsCollection.insertOne(product);
      res.send(result)
    })

    app.get('/categories', async (req, res) => {
      try {
        const uniqueCategories = await productsCollection.aggregate([
          { $unwind: '$product_categories' }, // Split arrays into separate documents
          { $group: { _id: '$product_categories' } }, // Group by product category
          { $project: { _id: 0, category: '$_id' } } // Project to rename _id as category
        ]).toArray();

        res.json(uniqueCategories.map(category => category.category));
      } catch (error) {
        console.error('Error retrieving categories:', error); // Log the error
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.patch("/updateCategories", async (req, res) => {
      const categoryToUpdate = req.body;
      const category = categoryToUpdate?.category;
      const previousCategory = categoryToUpdate?.previous_category;
      const image = categoryToUpdate?.image;
      const id = categoryToUpdate?.id;
      console.log(categoryToUpdate, image);

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          category
        }
      };

      if (image) {
        updateDoc.$set.image = image;
      }

      // Update the category
      const result = await categoryCollection.updateOne(filter, updateDoc);
      if (previousCategory == category) {
        return res.send({
          updatedCategory: result
        });
      }
      // If the category was updated successfully
      if (result.modifiedCount > 0) {
        // Update products with the new category (case insensitive)
        const productsUpdateResult = await productsCollection.updateMany(
          { "product_categories": previousCategory }, // Filter products by previous category
          { $set: { "product_categories.$[elem]": category } }, // Update matched category
          { arrayFilters: [{ "elem": { $regex: new RegExp('^' + previousCategory + '$', "i") } }] } // Case insensitive regex
        );

        res.send({
          updatedCategory: result,
          updatedProducts: productsUpdateResult
        });
      } else {
        res.status(404).send({ message: "Category not found" });
      }
    });



    app.delete("/deleteCategory/:name", async (req, res) => {
      const categoryName = req.params.name;

      // Delete the category from categoryCollection
      const deleteCategoryResult = await categoryCollection.deleteOne({ category: categoryName });

      if (deleteCategoryResult.deletedCount > 0) {
        // Delete the category from productsCollection
        const deleteProductsResult = await productsCollection.updateMany(
          { "product_categories": categoryName }, // Filter products by category name
          { $pull: { "product_categories": categoryName } } // Remove the category from the product_categories array
        );

        res.send({
          deletedCategory: deleteCategoryResult,
          deletedProducts: deleteProductsResult
        });
      } else {
        res.status(404).send({ message: "Category not found" });
      }
    });

    app.delete("/productDelete/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result)
    })
    app.delete("/orderDelete/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);
      res.send(result)
    })
    app.delete("/prisonDelete/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await prisonsCollection.deleteOne(filter);
      res.send(result)
    })
    app.delete("/customerDelete/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })
    app.delete("/artistDelete/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })

    app.get("/products", async (req, res) => {
      const { category, priceSlider, minRating, searchQuery, sort, tag } = req.query;
      if (!category && !priceSlider && !minRating && !searchQuery && !sort && !tag) {
        const result = await productsCollection.find().toArray();
        res.send(result);
      }
      console.log(category, priceSlider, minRating, searchQuery, sort, tag);
      let sortQuery = { "createdAt": -1 };
      if (sort == "newest") {
        sortQuery = { "createdAt": -1 };
      }
      if (sort == "oldest") {
        sortQuery = { "createdAt": 1 };
      }
      try {
        let matchedProducts;
        let priceQuery = {};
        let ratingQuery = {};
        let tagQuery = {};

        const priceSliderArray = priceSlider && priceSlider.length > 0 ? priceSlider.split(",").map(Number) : null;
        console.log(priceSliderArray);
        if (priceSliderArray && priceSliderArray.length === 2) {
          const minPrice = priceSliderArray[0];
          const maxPrice = priceSliderArray[1]; 

          priceQuery = { "price.sale_price": { $gte: minPrice, $lte: maxPrice } };
        }

        if (!priceQuery["price.sale_price"]) {
          priceQuery = { "price.regular_price": { $gte: minPrice, $lte: maxPrice } };
        }

        if (minRating) {
          ratingQuery = { rating: { $gte: parseInt(minRating.replace("rating", "")) } };
        }

        if (tag) {
          tagQuery = { product_tags: { $elemMatch: { $regex: new RegExp(tag, 'i') } } };
        }

        const searchRegex = new RegExp(searchQuery, 'i');

        if (category) {
          if (Object.keys(priceQuery).length !== 0) {
            if (Object.keys(ratingQuery).length !== 0) {
              matchedProducts = await productsCollection.find({
                $and: [
                  { product_categories: { $regex: category, $options: 'i' } },
                  priceQuery,
                  ratingQuery,
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            } else {
              matchedProducts = await productsCollection.find({
                $and: [
                  { product_categories: { $regex: category, $options: 'i' } },
                  priceQuery,
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            }
          } else {
            if (Object.keys(ratingQuery).length !== 0) {
              matchedProducts = await productsCollection.find({
                $and: [
                  { product_categories: { $regex: category, $options: 'i' } },
                  ratingQuery,
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            } else {
              matchedProducts = await productsCollection.find({
                $and: [
                  { product_categories: { $regex: category, $options: 'i' } },
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            }
          }
        } else {
          if (Object.keys(priceQuery).length !== 0) {
            if (Object.keys(ratingQuery).length !== 0) {
              matchedProducts = await productsCollection.find({
                $and: [
                  priceQuery,
                  ratingQuery,
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            } else {
              matchedProducts = await productsCollection.find({
                $and: [
                  priceQuery,
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            }
          } else {
            if (Object.keys(ratingQuery).length !== 0) {
              matchedProducts = await productsCollection.find({
                $and: [
                  ratingQuery,
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            } else {
              matchedProducts = await productsCollection.find({
                $and: [
                  tagQuery,
                  { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                ]
              }).sort(sortQuery).toArray();
            }
          }
        }

        res.json(matchedProducts);
      } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    app.post("/cart", async (req, res) => {
      const cartProduct = req.body;
      const result = await cartsCollection.insertOne(cartProduct);
      res.send(result)
    })
    app.get("/userCart/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;
      const filter = { addedBy: userEmail };
      const result = await cartsCollection.find(filter).toArray();
      res.send(result)
    })

    app.get("/popularProducts", async (req, res) => {
      const sort = { rating: -1 };
      const result = await productsCollection.find().sort(sort).limit(15).toArray();
      res.send(result)
    })

    app.get("/singleProduct/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(filter);
      res.send(result)
    })

    app.post('/relatedProducts', async (req, res) => {
      const product_categories = req.body;
      console.log(product_categories);

      try {
        const matchedProducts = await productsCollection.find({
          product_categories: { $regex: product_categories.join('|'), $options: 'i' }
        }).toArray();

        res.json(matchedProducts);
      } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post("/prisons", async (req, res) => {
      let prison = req.body;
      const email = prison?.email;
      const createdAt = new Date();
      prison.createdAt = createdAt;
      const filter = { email };
      const isPrisonAvailable = await prisonsCollection.findOne(filter);
      if (isPrisonAvailable) {
        res.status(500).send({ message: "This Email has already been taken" })
      }
      else {
        const result = await prisonsCollection.insertOne(prison);
        res.send(result)
      }
    })
    app.get("/prisons", async (req, res) => {
      let sortCriteria = { createdAt: -1 };
      const result = await prisonsCollection.find().sort(sortCriteria).toArray();
      res.send(result)
    })
    app.get("/prison/:email", async (req, res) => {
      const email = req.params.email;

      const result = await prisonsCollection.findOne({ email });
      res.send(result)
    })

    app.get("/users", async (req, res) => {
      let sortCriteria = { createdAt: -1 };
      const result = await usersCollection.find().sort(sortCriteria).toArray();
      res.send(result)
    })
    app.get("/customers", async (req, res) => {
      const filter = { userRole: "user" };
      let sortCriteria = { createdAt: -1 };
      const result = await usersCollection.find(filter).sort(sortCriteria).toArray();
      res.send(result)
    })
    app.get("/artists", async (req, res) => {
      const filter = { userRole: "artist" };
      let sortCriteria = { createdAt: -1 };
      const result = await usersCollection.find(filter).sort(sortCriteria).toArray();
      res.send(result)
    })

    app.get("/artist/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await usersCollection.findOne(filter);
      res.send(result);
    })

    app.post("/artistByAdmin", async (req, res) => {
      console.log(req.body);
      try {
        const userData = req.body; // Extract user data from request body
        const { email, password, userName } = userData;
        if (email) {
          const existingUser = await usersCollection.findOne({ email });
          if (existingUser) {
            return res.status(500).send({ message: "refetch" })
          }
        }

        if (email && password) {
          const createdUser = await admin.auth().createUser({
            email,
            password,
            userName
          });
        }


        const postUser = await usersCollection.insertOne(userData);
        res.status(201).send({ message: `Successfully created user` });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: error?.message });
      }
    })


    app.patch("/createLogin/:id", async (req, res) => {
      try {
        const { email, password, userName } = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const createdUser = await admin.auth().createUser({
          email,
          password,
          userName
        });

        const updateDoc = {
          $set: {
            email
          }
        };
        const result = await usersCollection.updateOne(filter, updateDoc)
        res.send(result)
      }
      catch (error) {
        console.error(error);
        res.status(500).send({ message: error?.message });
      }
    })

    app.get("/popularArtist", async (req, res) => {
      const sort = { total_products: -1 };
      const result = await usersCollection.find({ "userRole": "artist" }, 'email userName userPhoto _id').sort(sort).limit(12).toArray();
      res.send(result)
    })

    app.post("/users", async (req, res) => {
      let user = req.body;
      const createdAt = new Date();
      user.createdAt = createdAt;
      const query = { email: user.email }
      const existist = await usersCollection.findOne(query);
      if (existist) {
        return res.send({ error: true, message: "User already added in Collection" })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.get('/orders-last-12-months', async (req, res) => {
      try {
        // Calculate the start date (first day of the current month 12 months ago)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11);
        startDate.setDate(1);
        // Calculate the end date (last day of the current month)
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        // Aggregate orders for the last 12 months
        const ordersLast12Months = await db.collection('orders').aggregate([
          {
            $match: {
              createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } // Filter orders within the last 12 months
            }
          },
          {
            $group: {
              _id: {
                month: { $month: { $dateFromString: { dateString: "$createdAt" } } }, // Extract month from the date string
                year: { $year: { $dateFromString: { dateString: "$createdAt" } } } // Extract year from the date string
              },
              count: { $sum: 1 } // Count number of orders in each month and year
            }
          },
          {
            $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
          }
        ]).toArray();

        // Construct response object with counts for each month of the last 12 months
        const ordersCountLast12Months = {};

        // Iterate over all 12 months
        for (let i = 0; i < 12; i++) {
          // Calculate the month and year for the current iteration
          const monthYearKey = new Date(startDate);
          monthYearKey.setMonth(startDate.getMonth() + i);
          const month = monthYearKey.toLocaleString('en-us', { month: 'short' });
          const year = monthYearKey.getFullYear();

          // Initialize the count for the current month to 0
          ordersCountLast12Months[month] = 0;
        }

        // Update counts for existing months
        ordersLast12Months.forEach(monthYear => {
          const month = new Date(`${monthYear._id.year}-${monthYear._id.month}-01`).toLocaleString('en-us', { month: 'short' });
          ordersCountLast12Months[month] = monthYear.count;
        });

        res.json(ordersCountLast12Months);
      } catch (error) {
        console.error('Error fetching orders for the last 12 months:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.get("/sales-report-all", async (req, res) => {
      const status = req.query.status;
      console.log(status);
      let filter = {};
      if (status && status == "all") {
        filter = {}
      }
      else if (status) {
        filter = { status }
      }
      const result = await salesReportCollection.find(filter).toArray();
      res.send(result)
    })


    app.get('/popularTags', async (req, res) => {
      try {
        const popularTagsCursor = await productsCollection.aggregate([
          { $unwind: "$product_tags" },
          { $group: { _id: "$product_tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 1 } } // Project only the _id field
        ]);

        // Convert the cursor to an array of documents
        const popularTags = await popularTagsCursor.limit(10).toArray();

        // Extract tag names from the array of documents
        const tagNames = popularTags.map(tag => tag._id);

        res.json(tagNames);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
      }
    });




    app.get("/popularCategories", async (req, res) => {
      try {
        const popularCategories = await productsCollection.aggregate([
          { $unwind: '$product_categories' },
          {
            $project: {
              _id: 0,
              category: { $toLower: '$product_categories' },
              image: '$featured_photo' // Include featured photo URL
            }
          },
          {
            $group: {
              _id: '$category',
              image: { $first: '$image' }, // Get the featured photo URL from the first product in each category
              matchedCount: { $sum: 1 } // Count the occurrences of each category
            }
          },
          { $sort: { matchedCount: -1 } }, // Sort by matched count in descending order
          { $project: { _id: 0, category: '$_id', image: 1, count: '$matchedCount' } }, // Rename _id to category and include count
          { $limit: 12 }
        ]).toArray();

        // Save or update categories in categoryCollection
        for (const category of popularCategories) {
          const existingCategory = await categoryCollection.findOne({ category: category.category });
          if (existingCategory) {
            // Update existing category
            await categoryCollection.updateOne(
              { category: category.category },
              { $set: { count: category.count } }
            );
          } else {
            // Insert new category
            await categoryCollection.insertOne(category);
          }
        }

        const allCategories = await categoryCollection.find().sort({ count: -1 }).toArray();
        res.json(allCategories);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


    app.patch("/categories/:categoryName", async (req, res) => {
      try {
        const categoryName = req.params.categoryName;
        const { category, image } = req.body;

        // Check if the category exists
        const existingCategory = await categoryCollection.findOne({ category: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

        if (!existingCategory) {
          return res.status(404).json({ message: 'Category not found' });
        }

        // Update the category data
        const updatedData = {};
        if (category) updatedData.category = category.toLowerCase();
        if (image) updatedData.image = image;

        // Perform the update
        await categoryCollection.updateOne(
          { category: { $regex: new RegExp(`^${categoryName}$`, 'i') } },
          { $set: updatedData }
        );

        res.json({ message: 'Category updated successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


    app.post("/categories", async (req, res) => {
      try {
        const { category, image } = req.body;

        // Check if the category already exists in a case-insensitive manner
        const existingCategory = await categoryCollection.findOne({ category: { $regex: new RegExp(`^${category}$`, 'i') } });

        if (existingCategory) {
          return res.status(400).json({ message: 'Category already exists' });
        }

        // Insert the new category into the database
        const result = await categoryCollection.insertOne({ category: category.toLowerCase(), image });

        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/eachArtistProducts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { addedBy: id };
      const result = await productsCollection.find(filter).toArray();
      res.send(result)
    })

    app.get("/eachUser/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    app.patch("/userUpdate/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const { updatedName, updatedNum, userphoto } = req.body;

        const updateDoc = {};

        if (updatedName) {
          updateDoc.userName = updatedName;
        }
        if (updatedNum) {
          updateDoc.userPhoneNumber = updatedNum;
        }
        if (userphoto) {
          updateDoc.userPhoto = userphoto;
        }

        const result = await usersCollection.updateOne({ email }, { $set: updateDoc });

        res.send(result)
      } catch (error) {
        console.error("Error updating user data:", error);
        res.status(500).send("An error occurred while updating user data");
      }
    });
    app.patch("/prisonUpdate/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const { prison_name,
          country,
          states,
          address,
          zipCode,
          number, } = req.body;

        const updateDoc = {};

        if (prison_name) {
          updateDoc.prison_name = prison_name;
        }
        if (country) {
          updateDoc.country = country;
        }
        if (states) {
          updateDoc.states = states;
        }
        if (address) {
          updateDoc.address = address;
        }
        if (zipCode) {
          updateDoc.zipCode = zipCode;
        }
        if (number) {
          updateDoc.number = number;
        }

        const result = await prisonsCollection.updateOne({ email }, { $set: updateDoc });

        res.send(result)
      } catch (error) {
        console.error("Error updating user data:", error);
        res.status(500).send("An error occurred while updating user data");
      }
    });
    app.patch("/artistUpdate/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email, req.body?.userPhoto);
      const { updatedName,
        updatedNum,
        updatedBio,
        updatedKeyWords,
        updatedArtDescription,
        updatedBioVideo, userPhoto } = req.body;

      console.log(updatedName, updatedNum, email, userPhoto);
      const updateDoc = {
        $set: {
          userName: updatedName,
          bio: updatedBio,
          keyWords: updatedKeyWords,
          art_description: updatedArtDescription,
          bio_video_link: updatedBioVideo,
          userPhoto: userPhoto
        }
      };
      const filter = { email };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })


    app.patch("/userBillingInfoUpdate/:email", async (req, res) => {
      const email = req.params.email;
      const { updatedName, companyName, country, states, updatedAddress, zipCode, updatedNum } = req.body;
      console.log(updatedName, updatedNum, email);
      const updateDoc = {
        $set: {
          userName: updatedName,
          userPhoneNumber: updatedNum,
          "billingInfo.companyName": companyName,
          "billingInfo.country": country,
          "billingInfo.states": states,
          "billingInfo.address": updatedAddress,
          "billingInfo.zipCode": zipCode
        }
      };
      const filter = { email };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.patch("/reviews/:product_id", async (req, res) => {
      try {
        const reviewByUser = req.body;
        const product_id = req.params.product_id;

        // Assuming your MongoDB client is initialized and stored in a variable called 'db'

        // Filter to find the product by its ID
        const filter = { _id: new ObjectId(product_id) };

        // Update operation to push the new review to the beginning of the array
        const update = {
          $push: {
            reviews: {
              $each: [reviewByUser], // new review to be added
              $position: 0 // add it to the beginning of the array
            }
          }
        };

        // Perform the update
        const result = await productsCollection.updateOne(filter, update);

        // Check if the update was successful
        if (result.modifiedCount === 1) {
          // Recalculate product rating
          const product = await productsCollection.findOne(filter);
          const reviews = product.reviews || [];
          const totalReviews = reviews.length;
          let totalRating = 0;

          // Calculate total rating from all reviews
          reviews.forEach(review => {
            totalRating += review.rating || 0;
          });

          // Calculate the average rating
          const averageRating = totalRating / totalReviews;

          // Update product rating
          await productsCollection.updateOne(filter, {
            $set: {
              rating: averageRating
            }
          });

          res.status(200).send("Review added successfully");
        } else {
          res.status(404).send("Product not found");
        }
      } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { "userDetails.email": email };
      const sortCriteria = { createdAt: -1 };
      const result = await ordersCollection.find(filter).sort(sortCriteria).toArray();
      res.send(result)
    })
    app.get("/allOrders", async (req, res) => {
      const status = req.query.status;
      let sortCriteria = { createdAt: -1 };

      if (status && status != "all") {
        // If status is available, include it in the filtering criteria
        const filterCriteria = { status: status };
        const result = await ordersCollection.find(filterCriteria).sort(sortCriteria).toArray();
        res.send(result);
      } else {
        // If status is not provided, simply sort by createdAt
        const result = await ordersCollection.find().sort(sortCriteria).toArray();
        res.send(result);
      }
    });
    app.get("/singleOrder/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.findOne(filter);
      res.send(result)
    })


    app.patch("/updateProducts/:id", async (req, res) => {
      const updatedProductData = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updatedProductData
        }
      }
      const result = await productsCollection.updateOne(filter, updateDoc);
      res.send(result)
    })


    app.patch("/updateArtist/:id", async (req, res) => {
      const id = req.params.id;
      const artistUpdatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...artistUpdatedData
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })




    app.post("/orders", async (req, res) => {
      try {
        const order = req.body;
        const products = order.products;
        console.log(order);
        // Check each product in the order
        for (const product of products) {
          const { product_id, quantity } = product;

          // Check if product exists in productsCollection
          const existingProduct = await productsCollection.findOne({ _id: new ObjectId(product_id) });
          console.log(existingProduct);
          if (!existingProduct) {
            return res.status(500).send({ message: `Product with ID ${product_id} not found` });
          }

          // Check if available_quantity is sufficient
          if (existingProduct.available_quantity < quantity) {
            return res.status(400).send({ message: `Insufficient quantity for product ${product_id}` });
          }
        }

        // If all products are available and have sufficient quantity, insert the order
        const result = await ordersCollection.insertOne(order);
        res.status(201).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      console.log("to delete order", id);
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);
      res.send(result)
    })

    app.patch("/orderStatusUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.query.status;
      console.log(id, status);
      const filter = { _id: new ObjectId(id) };
      const order = await ordersCollection.findOne(filter);
      const website = await SystemSettingCollection.find().toArray();
      // Convert the date to a string
      const today = new Date();
      const dateString = today.toISOString();

      // Extract the substring from index 1 to 10
      const slicedDate = dateString.slice(0, 10);
      const updateDoc = {
        $set: {
          status
        }
      };
      if (status == "delivered") {

        
      }
      const result = ordersCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.post("/ordersUpdate/:id", async (req, res) => {
      const orderProductsId = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log(orderProductsId);
      

        
      const order = await ordersCollection.findOne(filter);
      console.log(order?._id);
      
      // const pdfFileName = `${uuidv4()}.pdf`;

      // Save PDF to temporary storage (Vercel Serverless Functions' /tmp directory)
      // const pdfFilePath = `/tmp/${pdfFileName}`;
        const recipientEmail = order?.shipping_address?.email || order?.userDetails?.email; // Assuming you're sending recipient's email in request body
        const htmlContent = `
        <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
        <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
          <title></title>
          
            <style type="text/css">
              @media only screen and (min-width: 620px) {
          .u-row {
            width: 600px !important;
          }
          .u-row .u-col {
            vertical-align: top;
          }
        
          .u-row .u-col-33p33 {
            width: 199.98px !important;
          }
        
          .u-row .u-col-50 {
            width: 300px !important;
          }
        
          .u-row .u-col-66p67 {
            width: 400.02px !important;
          }
        
          .u-row .u-col-100 {
            width: 600px !important;
          }
        
        }
        
        @media (max-width: 620px) {
          .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
          }
          .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
          }
          .u-row {
            width: 100% !important;
          }
          .u-col {
            width: 100% !important;
          }
          .u-col > div {
            margin: 0 auto;
          }
        }
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        a[x-apple-data-detectors='true'] {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        table, td { color: #000000; } @media (max-width: 480px) { #u_content_text_87 .v-text-align { text-align: left !important; } #u_content_text_88 .v-text-align { text-align: left !important; } #u_content_text_21 .v-text-align { text-align: center !important; } #u_content_text_22 .v-text-align { text-align: center !important; } #u_content_text_23 .v-text-align { text-align: center !important; } #u_content_text_92 .v-text-align { text-align: center !important; } #u_content_text_93 .v-text-align { text-align: center !important; } #u_content_text_94 .v-text-align { text-align: center !important; } }
            </style>
          
          
        
        <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->
        
        </head>
        
        <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #e7e7e7;color: #000000">
          <!--[if IE]><div class="ie-container"><![endif]-->
          <!--[if mso]><div class="mso-container"><![endif]-->
          <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%" cellpadding="0" cellspacing="0">
          <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->
            
          
          
            <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%" cellpadding="0" cellspacing="0">
            <tbody>
            <tr style="vertical-align: top">
              <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->
              
            
            
          <div class="u-row-container" style="padding: 0px;background-color: transparent">
            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
              <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                
          <!--[if (mso)|(IE)]><td align="center" width="200" style="background-color: #2d2d2d;width: 200px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #2d2d2d;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
            
          <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                  
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 0px;padding-left: 0px;" align="center">
                
                <img align="center" border="0" src='https://res.cloudinary.com/dyewzhari/image/upload/v1714760287/xednvgrqqv7knb0u8ayc.png' alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 180px;" width="180" height="80px"/>
                
              </td>
            </tr>
          </table>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]><td align="center" width="400" style="background-color: #2d2d2d;width: 400px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
          <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
            <div style="background-color: #2d2d2d;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
            
          <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:21px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <!--[if mso]><table width="100%"><tr><td><![endif]-->
              <h1 style="margin: 0px; color: #ffffff; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 22px; font-weight: 400;"><span><span>Thank you for your order</span></span></h1>
            <!--[if mso]></td></tr></table><![endif]-->
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
              </div>
            </div>
            </div>
            
          
          
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
              </td>
            </tr>
            </tbody>
            </table>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
          
        <table id="u_content_text_87" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:30px 10px 10px 15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; color: #34495e; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;"><strong><span style="font-family: Montserrat, sans-serif; line-height: 22.4px; font-size: 16px;">Hi ${order?.userDetails?.userName || order?.shipping_address?.username},</span></strong></span></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
        <table id="u_content_text_88" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 10px 15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; color: #34495e; line-height: 150%; text-align: left; word-wrap: break-word;">
            <p style="font-size: 14px; line-height: 150%;"><span style="font-size: 11pt; font-family: Arial, sans-serif; color: #000000; white-space-collapse: preserve; line-height: 21px;">Just to let you know — we've received your order #${order?._id?.toString()?.slice(-4)}, and it is now being processed:</span></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="0%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
            <tbody>
              <tr style="vertical-align: top">
                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                  <span>&#160;</span>
                </td>
              </tr>
            </tbody>
          </table>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 1px solid #403f3f;border-left: 1px solid #403f3f;border-right: 0px solid transparent;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #403f3f;border-left: 1px solid #403f3f;border-right: 0px solid transparent;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <!--[if mso]><table width="100%"><tr><td><![endif]-->
            <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 16px; font-weight: 700;"><span><span>Product</span></span></h1>
          <!--[if mso]></td></tr></table><![endif]-->
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 1px solid #3c3c3c;border-left: 1px solid #3b3a3a;border-right: 0px solid transparent;border-bottom: 1px solid #393939;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3c3c3c;border-left: 1px solid #3b3a3a;border-right: 0px solid transparent;border-bottom: 1px solid #393939;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <!--[if mso]><table width="100%"><tr><td><![endif]-->
            <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 16px; font-weight: 700;"><span><span><span><span>Quantity</span></span></span></span></h1>
          <!--[if mso]></td></tr></table><![endif]-->
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="198" style="width: 198px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <!--[if mso]><table width="100%"><tr><td><![endif]-->
            <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 16px; font-weight: 700;"><span><span><span>Price</span></span></span></h1>
          <!--[if mso]></td></tr></table><![endif]-->
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
        
          ${
            order?.products?.map(product => `<div class="u-row-container" style="padding: 0px;background-color: transparent">
            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
              <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                
          <!--[if (mso)|(IE)]><td align="center" width="198" style="background-color: #ebebef;width: 198px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #ebebef;height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;"><!--<![endif]-->
            
          <table id="u_content_text_21" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 10px 15px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <div class="v-text-align" style="font-size: 14px; color: #000000; line-height: 140%; text-align: left; word-wrap: break-word;">
              <p style="line-height: 140%;">${product?.product_name}</p>
            </div>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]><td align="center" width="199" style="background-color: #e8e8e8;width: 199px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #e8e8e8;height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;"><!--<![endif]-->
            
          <table id="u_content_text_22" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <div class="v-text-align" style="font-size: 14px; color: #000000; line-height: 140%; text-align: left; word-wrap: break-word;">
              <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;">${product?.quantity}</span></p>
            </div>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]><td align="center" width="199" style="background-color: #e8e6e6;width: 199px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #e8e6e6;height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;"><!--<![endif]-->
            
          <table id="u_content_text_23" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <div class="v-text-align" style="font-size: 14px; color: #000000; line-height: 140%; text-align: right; word-wrap: break-word;">
              <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;">$${(product?.price?.sale_price || product?.price?.regular_price) * product?.quantity}</span></p>
            </div>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
              </div>
            </div>
            </div>`)
          }
        
          
        
        
          
          
        
          
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Subtotal</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;">$${order?.subTotal}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 1px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Tax</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 1px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;">$${order?.tax}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">${order?.shippingMethod?.standard_shipping ? `Standard Shipping:` : ""}
            ${order?.shippingMethod?.express_shipping ? `Express Shipping:` : ""}
            ${order?.shippingMethod?.free_shipping == 0 ? `Free Shipping:` : ""}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;">${order?.shippingMethod?.standard_shipping ? `$${order?.shippingMethod?.standard_shipping}` : ""}
            ${order?.shippingMethod?.express_shipping ? `$${order?.shippingMethod?.express_shipping}` : ""}
            ${order?.shippingMethod?.free_shipping == 0 ? `${order?.shippingMethod?.free_shipping}` : ""}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 15px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;"><strong>Total</strong></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 16px; font-weight: 700; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;"><strong>$${order?.total_price}</strong></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="0%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #000100;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
            <tbody>
              <tr style="vertical-align: top">
                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                  <span>&#160;</span>
                </td>
              </tr>
            </tbody>
          </table>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="300" style="width: 300px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Billing Address</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="300" style="width: 300px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Shipping Address</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="298" style="width: 298px;padding: 0px;border-top: 1px solid #2f2e2e;border-left: 1px solid #2f2e2e;border-right: 1px solid #2f2e2e;border-bottom: 1px solid #2f2e2e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #2f2e2e;border-left: 1px solid #2f2e2e;border-right: 1px solid #2f2e2e;border-bottom: 1px solid #2f2e2e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 15px; line-height: 170%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 170%;">${order?.userDetails?.userName}</p>
        <p style="line-height: 170%;">${order?.userDetails?.address}, ${order?.userDetails?.country}, ${order?.userDetails?.states}-${order?.userDetails?.zipCode}</p>
        <p style="line-height: 170%;">${order?.userDetails?.userPhoneNumber}</p>
        <p style="line-height: 170%;">${order?.userDetails?.email}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="299" style="width: 299px;padding: 0px;border-top: 1px solid #3c3c3c;border-left: 0px solid transparent;border-right: 1px solid #434242;border-bottom: 1px solid #3e3e3e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3c3c3c;border-left: 0px solid transparent;border-right: 1px solid #434242;border-bottom: 1px solid #3e3e3e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 15px; line-height: 170%; text-align: left; word-wrap: break-word;">
          <p style="line-height: 170%;">${order?.shipping_address?.userName || order?.userDetails?.userName}</p>
          <p style="line-height: 170%;">${order?.shipping_address?.address || order?.userDetails?.address}, ${order?.shipping_address?.country || order?.userDetails?.country}, ${order?.shipping_address?.states || order?.userDetails?.states}-${order?.shipping_address?.zipCode || order?.userDetails?.zipCode}</p>
          <p style="line-height: 170%;">${order?.shipping_address?.userPhoneNumber || order?.userDetails?.userPhoneNumber}</p>
          <p style="line-height: 170%;">${order?.shipping_address?.email || order?.userDetails?.email}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 20px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 20px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 16px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;"><span style="color: #000000; white-space-collapse: preserve; line-height: 22.4px;">Thanks for using MBB.</span></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
          </tbody>
          </table>
          <!--[if mso]></div><![endif]-->
          <!--[if IE]></div><![endif]-->
        </body>
        
        </html>
        
        `;
        const htmlContentForPDF = `
        <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
        <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
          <title></title>
          
            <style type="text/css">
              @media only screen and (min-width: 620px) {
          .u-row {
            width: 600px !important;
          }
          .u-row .u-col {
            vertical-align: top;
          }
        
          .u-row .u-col-33p33 {
            width: 199.98px !important;
          }
        
          .u-row .u-col-50 {
            width: 300px !important;
          }
        
          .u-row .u-col-66p67 {
            width: 400.02px !important;
          }
        
          .u-row .u-col-100 {
            width: 600px !important;
          }
        
        }
        
        @media (max-width: 620px) {
          .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
          }
          .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
          }
          .u-row {
            width: 100% !important;
          }
          .u-col {
            width: 100% !important;
          }
          .u-col > div {
            margin: 0 auto;
          }
        }
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        a[x-apple-data-detectors='true'] {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        table, td { color: #000000; } @media (max-width: 480px) { #u_content_text_87 .v-text-align { text-align: left !important; } #u_content_text_88 .v-text-align { text-align: left !important; } #u_content_text_21 .v-text-align { text-align: center !important; } #u_content_text_22 .v-text-align { text-align: center !important; } #u_content_text_23 .v-text-align { text-align: center !important; } #u_content_text_92 .v-text-align { text-align: center !important; } #u_content_text_93 .v-text-align { text-align: center !important; } #u_content_text_94 .v-text-align { text-align: center !important; } }
            </style>
          
          
        
        <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->
        
        </head>
        
        <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #e7e7e7;color: #000000">
          <!--[if IE]><div class="ie-container"><![endif]-->
          <!--[if mso]><div class="mso-container"><![endif]-->
          <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%" cellpadding="0" cellspacing="0">
          <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->
            
          
          
            <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%" cellpadding="0" cellspacing="0">
            <tbody>
            <tr style="vertical-align: top">
              <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->
              
            
            
          <div class="u-row-container" style="padding: 0px;background-color: transparent">
            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
              <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                
          <!--[if (mso)|(IE)]><td align="center" width="200" style="background-color: #2d2d2d;width: 200px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #2d2d2d;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
            
          <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                  
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 0px;padding-left: 0px;" align="center">
                
                <img align="center" border="0" src='https://res.cloudinary.com/dyewzhari/image/upload/v1715000195/tun3aulifpvitpbn5pqj.png' alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 180px;" width="180" height="80px"/>
                
              </td>
            </tr>
          </table>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]><td align="center" width="400" style="background-color: #2d2d2d;width: 400px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
          <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
            <div style="background-color: #2d2d2d;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
            
          <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:21px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <!--[if mso]><table width="100%"><tr><td><![endif]-->
              <h1 style="margin: 0px; color: #2d2d2d; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 22px; font-weight: 400;"><span><span>Thank you for your order</span></span></h1>
            <!--[if mso]></td></tr></table><![endif]-->
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
              </div>
            </div>
            </div>
            
          
          
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
              </td>
            </tr>
            </tbody>
            </table>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
          
        <table id="u_content_text_87" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:30px 10px 10px 15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; color: #34495e; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;"><strong><span style="font-family: Montserrat, sans-serif; line-height: 22.4px; font-size: 16px;">Hi ${order?.userDetails?.userName || order?.shipping_address?.username},</span></strong></span></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
        <table id="u_content_text_88" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 10px 15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; color: #34495e; line-height: 150%; text-align: left; word-wrap: break-word;">
            <p style="font-size: 14px; line-height: 150%;"><span style="font-size: 11pt; font-family: Arial, sans-serif; color: #000000; white-space-collapse: preserve; line-height: 21px;">Just to let you know — we've received your order #${order?._id?.toString()?.slice(-4)}, and it is now being processed:</span></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="0%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
            <tbody>
              <tr style="vertical-align: top">
                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                  <span>&#160;</span>
                </td>
              </tr>
            </tbody>
          </table>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 1px solid #403f3f;border-left: 1px solid #403f3f;border-right: 0px solid transparent;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #403f3f;border-left: 1px solid #403f3f;border-right: 0px solid transparent;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <!--[if mso]><table width="100%"><tr><td><![endif]-->
            <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 16px; font-weight: 700;"><span><span>Product</span></span></h1>
          <!--[if mso]></td></tr></table><![endif]-->
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 1px solid #3c3c3c;border-left: 1px solid #3b3a3a;border-right: 0px solid transparent;border-bottom: 1px solid #393939;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3c3c3c;border-left: 1px solid #3b3a3a;border-right: 0px solid transparent;border-bottom: 1px solid #393939;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <!--[if mso]><table width="100%"><tr><td><![endif]-->
            <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 16px; font-weight: 700;"><span><span><span><span>Quantity</span></span></span></span></h1>
          <!--[if mso]></td></tr></table><![endif]-->
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="198" style="width: 198px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <!--[if mso]><table width="100%"><tr><td><![endif]-->
            <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 16px; font-weight: 700;"><span><span><span>Price</span></span></span></h1>
          <!--[if mso]></td></tr></table><![endif]-->
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
        
          ${
            order?.products?.map(product => `<div class="u-row-container" style="padding: 0px;background-color: transparent">
            <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
              <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                
          <!--[if (mso)|(IE)]><td align="center" width="198" style="background-color: #ebebef;width: 198px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #ebebef;height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;"><!--<![endif]-->
            
          <table id="u_content_text_21" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 10px 15px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <div class="v-text-align" style="font-size: 14px; color: #000000; line-height: 140%; text-align: left; word-wrap: break-word;">
              <p style="line-height: 140%;">${product?.product_name}</p>
            </div>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]><td align="center" width="199" style="background-color: #e8e8e8;width: 199px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #e8e8e8;height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;"><!--<![endif]-->
            
          <table id="u_content_text_22" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <div class="v-text-align" style="font-size: 14px; color: #000000; line-height: 140%; text-align: left; word-wrap: break-word;">
              <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;">${product?.quantity}</span></p>
            </div>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
          <!--[if (mso)|(IE)]><td align="center" width="199" style="background-color: #e8e6e6;width: 199px;padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;" valign="top"><![endif]-->
          <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
            <div style="background-color: #e8e6e6;height: 100%;width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3b3a3a;border-left: 0px solid transparent;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #3b3a3a;"><!--<![endif]-->
            
          <table id="u_content_text_23" style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                  
            <div class="v-text-align" style="font-size: 14px; color: #000000; line-height: 140%; text-align: right; word-wrap: break-word;">
              <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;">$${(product?.price?.sale_price || product?.price?.regular_price) * product?.quantity}</span></p>
            </div>
          
                </td>
              </tr>
            </tbody>
          </table>
          
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
          </div>
          <!--[if (mso)|(IE)]></td><![endif]-->
                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
              </div>
            </div>
            </div>`)
          }
        
          
        
        
          
          
        
          
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Subtotal</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;">$${order?.subTotal}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 1px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Tax</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 1px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;">$${order?.tax}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">${order?.shippingMethod?.standard_shipping ? `Standard Shipping:` : ""}
            ${order?.shippingMethod?.express_shipping ? `Express Shipping:` : ""}
            ${order?.shippingMethod?.free_shipping == 0 ? `Free Shipping:` : ""}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;">${order?.shippingMethod?.standard_shipping ? `$${order?.shippingMethod?.standard_shipping}` : ""}
            ${order?.shippingMethod?.express_shipping ? `$${order?.shippingMethod?.express_shipping}` : ""}
            ${order?.shippingMethod?.free_shipping == 0 ? `${order?.shippingMethod?.free_shipping}` : ""}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="398" style="width: 398px;padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-66p67" style="max-width: 320px;min-width: 400px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 1px solid #3b3a3a;border-right: 1px solid #3b3a3a;border-bottom: 1px solid #323232;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 15px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;"><strong>Total</strong></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="199" style="width: 199px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-33p33" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 1px solid #2a2a2a;border-bottom: 1px solid #3b3a3a;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:15px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 16px; font-weight: 700; line-height: 140%; text-align: right; word-wrap: break-word;">
            <p style="line-height: 140%;"><strong>$${order?.total_price}</strong></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="0%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #000100;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
            <tbody>
              <tr style="vertical-align: top">
                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                  <span>&#160;</span>
                </td>
              </tr>
            </tbody>
          </table>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="300" style="width: 300px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Billing Address</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="300" style="width: 300px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 14px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;">Shipping Address</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="298" style="width: 298px;padding: 0px;border-top: 1px solid #2f2e2e;border-left: 1px solid #2f2e2e;border-right: 1px solid #2f2e2e;border-bottom: 1px solid #2f2e2e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #2f2e2e;border-left: 1px solid #2f2e2e;border-right: 1px solid #2f2e2e;border-bottom: 1px solid #2f2e2e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 15px; line-height: 170%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 170%;">${order?.userDetails?.userName}</p>
        <p style="line-height: 170%;">${order?.userDetails?.address}, ${order?.userDetails?.country}, ${order?.userDetails?.states}-${order?.userDetails?.zipCode}</p>
        <p style="line-height: 170%;">${order?.userDetails?.userPhoneNumber}</p>
        <p style="line-height: 170%;">${order?.userDetails?.email}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
        <!--[if (mso)|(IE)]><td align="center" width="299" style="width: 299px;padding: 0px;border-top: 1px solid #3c3c3c;border-left: 0px solid transparent;border-right: 1px solid #434242;border-bottom: 1px solid #3e3e3e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-50" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 1px solid #3c3c3c;border-left: 0px solid transparent;border-right: 1px solid #434242;border-bottom: 1px solid #3e3e3e;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 15px; line-height: 170%; text-align: left; word-wrap: break-word;">
          <p style="line-height: 170%;">${order?.shipping_address?.userName || order?.userDetails?.userName}</p>
          <p style="line-height: 170%;">${order?.shipping_address?.address || order?.userDetails?.address}, ${order?.shipping_address?.country || order?.userDetails?.country}, ${order?.shipping_address?.states || order?.userDetails?.states}-${order?.shipping_address?.zipCode || order?.userDetails?.zipCode}</p>
          <p style="line-height: 170%;">${order?.shipping_address?.userPhoneNumber || order?.userDetails?.userPhoneNumber}</p>
          <p style="line-height: 170%;">${order?.shipping_address?.email || order?.userDetails?.email}</p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
          
          
        <div class="u-row-container" style="padding: 0px;background-color: transparent">
          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
              
        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 20px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
          <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
          <!--[if (!mso)&(!IE)]><!--><div style="box-sizing: border-box; height: 100%; padding: 20px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;"><!--<![endif]-->
          
        <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tbody>
            <tr>
              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Montserrat',sans-serif;" align="left">
                
          <div class="v-text-align" style="font-size: 16px; font-weight: 700; line-height: 140%; text-align: left; word-wrap: break-word;">
            <p style="line-height: 140%;"><span style="color: #000000; white-space-collapse: preserve; line-height: 22.4px;">Thanks for using MBB.</span></p>
          </div>
        
              </td>
            </tr>
          </tbody>
        </table>
        
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
        <!--[if (mso)|(IE)]></td><![endif]-->
              <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
            </div>
          </div>
          </div>
          
        
        
            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
          </tbody>
          </table>
          <!--[if mso]></div><![endif]-->
          <!--[if IE]></div><![endif]-->
        </body>
        
        </html>
        
        `;
        try {
        //   if (!browser) {
        //     await launchBrowser();
        // }
          const updatePromises = orderProductsId.map(async product => {
            const query = { _id: new ObjectId(product?.product_id) };
            const updateDocForProduct = {
              $inc: { available_quantity: -product?.quantity }
            }; 
            return await productsCollection.updateOne(query, updateDocForProduct);
          });
          await Promise.all(updatePromises);
          const pdfBuffer = await generatePDFFromHTML(htmlContentForPDF);
          // fs.writeFileSync(pdfFilePath, pdfBuffer);
        await sendEmailWithAttachment(pdfBuffer, recipientEmail, htmlContent);
      } catch (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({Error_Message: `${error}`});
      } 
      // finally {
      //     // Clean up resources (e.g., delete the generated PDF)
      //     // Make sure to handle any errors in cleanup process
      //     try {
      //         // Delete the generated PDF file
      //         // fs.unlinkSync(pdfFilePath);
      //     } catch (error) {
      //         console.error('Error deleting PDF file:', error);
      //         return res.status(500).json({Error_Message_Deleting_PDF_FILE: `${error}`});
      //     }
      // }

      // Wait for all product updates to complete
      

      const transactionId = req.query.transactionId;
      const updateDoc = {
        $set: { transactionId }
      };

      const result = await ordersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


 

    app.get('/sales-report', async (req, res) => {
      const artistId = req.query.artistId;
      if (!artistId) {
        return res.status(500).json({ error: 'Artist ID not provided' });
      }

      try {
        // Check if there are any unreported sales reports for the artist
        const existingReports = await salesReportCollection.find({ artistId, isReportGenerated: false }).toArray();
        // console.log(existingReports);
        if (existingReports.length > 0) {
          // If there are unreported sales reports, return the first one found
          return res.json({ _id: existingReports[0]._id, artistId, products: existingReports[0].products, status: existingProducts[0].status, isReportGenerated: false });
        }

        // Collect products from ordersCollection for the specified artistEmail
        const orders = await ordersCollection.find({
          'products.artist_details.artist': artistId,
          'status': 'delivered'
        }).toArray();
        // console.log(orders);
        console.log(orders);
        if (orders.length == 0) {
          return res.json({ products: orders });
        }
        // Extract products sold by the artist from the orders and add order_id to each product
        const artistProducts = orders.reduce((acc, order) => {
          const products = order.products.filter(product => product.artist_details.artist === artistId);
          return acc.concat(products.map(product => ({ ...product, order_id: order._id.toString() })));
        }, []);
        // console.log(artistProducts);
        // Check for existing products in the salesReportCollection
        const existingProducts = await salesReportCollection.find({ 'products.order_id': { $in: artistProducts.map(p => p.order_id) } }).toArray();

        // Find products that aren't already present in the salesReportCollection
        const newArtistProducts = artistProducts.filter(product => !existingProducts.some(existingProduct => existingProduct.products.some(p => p.order_id === product.order_id)));
        console.log(newArtistProducts);
        if (newArtistProducts.length == 0) {
          return res.json({ products: newArtistProducts });
        }
        // Insert new sales report into the salesReportCollection
        const insertResult = await salesReportCollection.insertOne({ artistId, products: newArtistProducts, status: 'unpaid', isReportGenerated: true });

        // Return the inserted sales report along with its _id and new products
        return res.json({ _id: insertResult.insertedId, artistId, products: newArtistProducts, status: 'unpaid', isReportGenerated: true });
      } catch (error) {
        console.error('Error retrieving or updating artist products:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get("/bannerImages", async (req, res) => {
      const result = await bannerImageCollection.find().toArray();
      res.send(result)
    })

    app.post("/bannerImages", async (req, res) => {
      const banner = req.body;
      const result = await bannerImageCollection.insertOne(banner);
      res.send(result)
    })

    app.get('/isPurchased', async (req, res) => {
      const { email, productId } = req.query;

      try {

        // Search for orders matching the email and containing the product ID
        const order = await ordersCollection.findOne({
          'userDetails.email': email,
          'products.product_id': productId
        });

        if (order) {
          res.json({ available: true });
        } else {
          res.json({ available: false });
        }
      } catch (err) {
        console.error('Error checking product availability:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });



    app.patch("/sales-report-update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "paid"
        }
      }
      const result = await salesReportCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.get("/taxAndShippingData", async (req, res) => {
      const result = await taxAndShippingMethodCollection.find().toArray();
      res.send(result)
    })

    app.get("/taxAndShippingDataByStateAndZip", async (req, res) => {
      const state = req.query.state;
      const zipCode = req.query.zipCode;

      // Perform case-insensitive search for the exact state name
      const stateShippingData = await taxAndShippingMethodCollection.findOne({ states: { $regex: new RegExp(`^${state}$`, 'i') } });

      if (stateShippingData) {
        // If state data found, send its shipping_methods
        res.send({ shipping_methods: stateShippingData.shipping_methods, tax_rate: stateShippingData?.tax_rate });
      } else {
        // If state data not found, search by zip code
        const zipCodeShippingData = await taxAndShippingMethodCollection.findOne({ zipCode: zipCode });

        if (zipCodeShippingData) {
          // If zip code data found, send its shipping_methods
          res.send({ shipping_methods: zipCodeShippingData.shipping_methods, tax_rate: stateShippingData?.tax_rate });
        } else {
          // If neither state nor zip code data found, send 404
          res.status(404).send("Shipping data not found for the provided state and zip code.");
        }
      }
    });




    app.post("/taxAndShippingMethod", async (req, res) => {
      const data = req.body;

      // Check if the state already exists
      const existingState = await taxAndShippingMethodCollection.findOne({ states: { $regex: new RegExp(data.states, 'i') } });
      if (existingState) {
        res.status(400).send("State already exists.");
        return;
      }

      // Check if the zip code already exists
      const existingZipCode = await taxAndShippingMethodCollection.findOne({ zipCode: data.zipCode });
      if (existingZipCode) {
        res.status(400).send("Zip code already exists.");
        return;
      }

      // If neither the state nor the zip code exists, insert the data
      const result = await taxAndShippingMethodCollection.insertOne(data);
      res.send(result);
    });



    app.delete("/taxAndShippingDelete/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await taxAndShippingMethodCollection.deleteOne(filter);
      res.send(result)
    })



    app.patch("/taxAndShippingMethodUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = {
        $set: {
          ...data
        }
      };
      const result = await taxAndShippingMethodCollection.updateOne(filter, updateDoc);
      res.send(result)
    })





    app.get('/artist-sales/:artistId', async (req, res) => {
      try {
        const artistId = req.params.artistId;
        // Find orders where artist added the product
        const orders = await ordersCollection.find({
          'products': {
            $elemMatch: {
              'artist_details.artist': artistId
            }
          }
        }).toArray();
        console.log(orders);
        let totalArtistProfit = 0;
        let totalWebsiteProfit = 0;
        let totalPrisonProfit = 0;

        // Calculate total profits
        orders.forEach(order => {
          order.products.forEach(product => {
            if (product?.artist_details?.artist === artistId) {
              const quantity = product.quantity;
              const artistTotal = product.profit_distribution.artist_profit_details.artistTotal;
              const websiteProfit = product.profit_distribution.website_profit_details.websiteProfit;
              const prisonProfit = product.profit_distribution.prison_profit_details.prisonProfit;
              totalArtistProfit += quantity * artistTotal;
              totalWebsiteProfit += quantity * websiteProfit;
              totalPrisonProfit += quantity * prisonProfit;
            }
          });
        });

        res.json({
          artistId,
          totalArtistProfit,
          totalWebsiteProfit,
          totalPrisonProfit
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    app.post('/create-payment-intent', async (req, res) => {
      const { subTotal } = req.body;
      const amount = subTotal * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ["card"]
      })

      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, async (req, res) => {
  console.log(`Server is running on port ${port}`);
    // await launchBrowser();
});




