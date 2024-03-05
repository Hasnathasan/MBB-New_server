const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require("cors");
// var jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { Readable } = require('stream');
require('dotenv').config()
const app = express();
// const stripe = require("stripe")(process.env.PAYMENT_SECRETKEY)
const port = process.env.PORT || 8000;



// Middleware

app.use(cors());
app.use(express.json());
app.use(fileUpload());


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


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uf4d7tl.mongodb.net/?retryWrites=true&w=majority`;
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
    const cartsCollection = db.collection("cart");




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


    app.post('/uploadMultiple', async (req, res) => {
      try {
        if (!req.files || !req.files.files || req.files.files.length === 0) {
          return res.status(400).json({ message: 'No files were uploaded.' });
        }
    
        const images = req.files.files;
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

   

    app.post("/products", async (req, res) => {
      const addedBy = product?.addedBy;
      const filter = {email: addedBy};
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

    app.get("/products", async (req, res) => {
      const { category, priceSlider, minRating, searchQuery } = req.query;
  
      try {
          let matchedProducts;
          let priceQuery = {};
          let ratingQuery = {};
  
          // Parse priceSlider to an array and convert values to numbers
          const priceSliderArray = priceSlider && priceSlider.length > 0 ? priceSlider.split(",").map(Number) : null;
  
          if (priceSliderArray && priceSliderArray.length === 2) {
              const minPrice = priceSliderArray[0];
              const maxPrice = priceSliderArray[1];
  
              // Check if the product has sale_price within the price range
              priceQuery = { "price.sale_price": { $gte: minPrice, $lte: maxPrice } };
          }
  
          // If sale_price not available, fall back to regular_price
          if (!priceQuery["price.sale_price"]) {
              priceQuery = { "price.regular_price": { $gte: minPrice, $lte: maxPrice } };
          }
  
          if (minRating) {
              // Construct rating query based on minRating
              ratingQuery = { rating: { $gte: parseInt(minRating.replace("rating", "")) } };
          }
  
          const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive regex for search
  
          if (category) {
              if (Object.keys(priceQuery).length !== 0) {
                  if (Object.keys(ratingQuery).length !== 0) {
                      // Filter by category, price range, minimum rating, and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              { product_categories: { $regex: category, $options: 'i' } },
                              priceQuery,
                              ratingQuery,
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  } else {
                      // Filter by category, price range, and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              { product_categories: { $regex: category, $options: 'i' } },
                              priceQuery,
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  }
              } else {
                  if (Object.keys(ratingQuery).length !== 0) {
                      // Filter by category, minimum rating, and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              { product_categories: { $regex: category, $options: 'i' } },
                              ratingQuery,
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  } else {
                      // Filter only by category and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              { product_categories: { $regex: category, $options: 'i' } },
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  }
              }
          } else {
              if (Object.keys(priceQuery).length !== 0) {
                  if (Object.keys(ratingQuery).length !== 0) {
                      // Filter only by price range, minimum rating, and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              priceQuery,
                              ratingQuery,
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  } else {
                      // Filter only by price range and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              priceQuery,
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  }
              } else {
                  if (Object.keys(ratingQuery).length !== 0) {
                      // Filter only by minimum rating and search query
                      matchedProducts = await productsCollection.find({
                          $and: [
                              ratingQuery,
                              { $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }] }
                          ]
                      }).toArray();
                  } else {
                      // Filter only by search query
                      matchedProducts = await productsCollection.find({
                          $or: [{ product_name: searchRegex }, { product_categories: { $elemMatch: { $regex: searchRegex } } }, { product_tags: { $elemMatch: { $regex: searchRegex } } }]
                      }).toArray();
                  }
              }
          }
  
          res.json(matchedProducts);
      } catch (error) {
          console.error('Error searching for products:', error);
          res.status(500).json({ error: 'Internal server error' });
      }
  });
  
    // app.get("/products", async (req, res) => {
    //   const { category, priceSlider, minRating } = req.query;
    
    //   try {
    //     let matchedProducts;
    //     let priceQuery = {};
    //     let ratingQuery = {};
    
    //     // Parse priceSlider to an array and convert values to numbers
    //     const priceSliderArray = priceSlider && priceSlider.length > 0 ? priceSlider.split(",").map(Number) : null;
    
    //     if (priceSliderArray && priceSliderArray.length === 2) {
    //       const minPrice = priceSliderArray[0];
    //       const maxPrice = priceSliderArray[1];
    
    //       // Check if the product has sale_price within the price range
    //       priceQuery = { "price.sale_price": { $gte: minPrice, $lte: maxPrice } };
    //     }
    
    //     // If sale_price not available, fall back to regular_price
    //     if (!priceQuery["price.sale_price"]) {
    //       priceQuery = { "price.regular_price": { $gte: minPrice, $lte: maxPrice } };
    //     }
    
    //     if (minRating) {
    //       // Construct rating query based on minRating
    //       ratingQuery = { rating: { $gte: parseInt(minRating.replace("rating", "")) } };
    //     }
    
    //     if (category) {
    //       if (Object.keys(priceQuery).length !== 0) {
    //         if (Object.keys(ratingQuery).length !== 0) {
    //           // Filter by category, price range, and minimum rating
    //           matchedProducts = await productsCollection.find({
    //             $and: [
    //               { product_categories: { $regex: category, $options: 'i' } },
    //               priceQuery,
    //               ratingQuery
    //             ]
    //           }).toArray();
    //         } else {
    //           // Filter by category and price range
    //           matchedProducts = await productsCollection.find({
    //             $and: [
    //               { product_categories: { $regex: category, $options: 'i' } },
    //               priceQuery
    //             ]
    //           }).toArray();
    //         }
    //       } else {
    //         if (Object.keys(ratingQuery).length !== 0) {
    //           // Filter by category and minimum rating
    //           matchedProducts = await productsCollection.find({
    //             $and: [
    //               { product_categories: { $regex: category, $options: 'i' } },
    //               ratingQuery
    //             ]
    //           }).toArray();
    //         } else {
    //           // Filter only by category
    //           matchedProducts = await productsCollection.find({
    //             product_categories: { $regex: category, $options: 'i' }
    //           }).toArray();
    //         }
    //       }
    //     } else {
    //       if (Object.keys(priceQuery).length !== 0) {
    //         if (Object.keys(ratingQuery).length !== 0) {
    //           // Filter only by price range and minimum rating
    //           matchedProducts = await productsCollection.find({
    //             $and: [
    //               priceQuery,
    //               ratingQuery
    //             ]
    //           }).toArray();
    //         } else {
    //           // Filter only by price range
    //           matchedProducts = await productsCollection.find(priceQuery).toArray();
    //         }
    //       } else {
    //         if (Object.keys(ratingQuery).length !== 0) {
    //           // Filter only by minimum rating
    //           matchedProducts = await productsCollection.find(ratingQuery).toArray();
    //         } else {
    //           // Fetch all products
    //           matchedProducts = await productsCollection.find().toArray();
    //         }
    //       }
    //     }
    
    //     res.json(matchedProducts);
    //   } catch (error) {
    //     console.error('Error searching for products:', error);
    //     res.status(500).json({ error: 'Internal server error' });
    //   }
    // });

   
    app.post("/cart", async(req, res) => {
      const cartProduct = req.body;
      const result = await cartsCollection.insertOne(cartProduct);
      res.send(result)
    })
    app.get("/userCart/:userEmail", async(req, res) => {
      const userEmail = req.params.userEmail;
      const filter = {addedBy: userEmail};
      const result = await cartsCollection.find(filter).toArray();
      res.send(result)
    })

    app.get("/popularProducts", async(req, res) => {
      const sort = {rating: -1};
      const result = await productsCollection.find().sort(sort).limit(15).toArray();
      res.send(result)
    })

    app.get("/singleProduct/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await productsCollection.findOne(filter);
      res.send(result)
    })

    app.post('/relatedProducts', async (req, res) => {
      const  product_categories  = req.body;
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
      const prison = req.body;
      const result = await prisonsCollection.insertOne(prison);
      res.send(result)
    })
    app.get("/prisons", async (req, res) => {
      const result = await prisonsCollection.find().toArray();
      res.send(result)
    })

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })
    app.get("/customers", async (req, res) => {
      const filter = { userRole: "user" }
      const result = await usersCollection.find(filter).toArray();
      res.send(result)
    })
    app.get("/artists", async (req, res) => {
      const filter = { userRole: "artist" }
      const result = await usersCollection.find(filter).toArray();
      res.send(result)
    })

    app.get("/artist/:email", async(req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({email});
      res.send(result);
    })

    app.get("/popularArtist", async(req, res) => {
      const sort = {total_products : -1};
      const result = await usersCollection.find({}, 'email userName userPhoto _id').sort(sort).limit(12).toArray();
      res.send(result)
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existist = await usersCollection.findOne(query);
      if (existist) {
        return res.send({ error: true, message: "User already added in Collection" })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.get("/popularCategories", async(req, res) => {
      try {
    
        const popularCategories = await productsCollection.aggregate([
          { $unwind: '$product_categories' },
          { $project: { 
            _id: 0,
            category: { $toLower: '$product_categories' },
            image: '$featured_photo' // Include featured photo URL
          } },
          { $group: { 
            _id: '$category',
            image: { $first: '$image' }, // Get the featured photo URL from the first product in each category
            matchedCount: { $sum: 1 } // Count the occurrences of each category
          } },
          { $sort: { matchedCount: -1 } }, // Sort by matched count in descending order
          { $project: { _id: 0, category: '$_id', image: 1, count: '$matchedCount' } }, // Rename _id to category and include count
          { $limit: 12 }
        ]).toArray();
    
        res.json(popularCategories);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    })

    app.get("/eachArtistProducts/:email", async(req, res) => {
      const email = req.params.email;
      const filter = {addedBy: email};
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
      const email = req.params.email;
      const { updatedName, updatedNum } = req.body;
      console.log(updatedName, updatedNum, email);
      const updateDoc = {
        $set: {
          userName: updatedName,
          userPhoneNumber: updatedNum
        }
      };
    })
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

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});








