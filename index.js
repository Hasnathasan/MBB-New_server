const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require("cors");
// var jwt = require('jsonwebtoken');
var admin = require("firebase-admin");
const stripe = require("stripe")(process.env.PAYMENT_SECRETKEY)
var serviceAccount = require("./public/mbb-e-commerce-firebase-adminsdk-jcum3-7d69c2b6db.json");



const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
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
    const ordersCollection = db.collection("orders");
    const categoryCollection = db.collection("categories");




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
    app.get("/ordersLength", async (req, res) => {
      try {
        const productsCount = await productsCollection.countDocuments();
        res.json({ length: productsCount });
      } catch (error) {
        console.error("Error retrieving product count:", error);
        res.status(500).json({ error: "Internal server error" });
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
      const filter = { email: addedBy };
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
      const prison = req.body;
      const email = prison?.email;
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

    app.get("/artist/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    })

    app.post("/artistByAdmin", async (req, res) => {
      console.log(req.body);
      try {
        const userData = req.body; // Extract user data from request body
        const { email, password, userName } = userData;

        if (!email || !password || !userName) {
          return res.status(400).send({ message: 'Missing required fields' });
        }

        const createdUser = await admin.auth().createUser({
          email,
          password,
          userName,
        });
        const postUser = await usersCollection.insertOne(userData);
        res.status(201).send({ message: `Successfully created user` });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: error?.message });
      }
    })

    app.get("/popularArtist", async (req, res) => {
      const sort = { total_products: -1 };
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
              { $set: { count: category.count, image: category.image } }
            );
          } else {
            // Insert new category
            await categoryCollection.insertOne(category);
          }
        }
  
        res.json(popularCategories);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


    app.put("/categories/:categoryName", async (req, res) => {
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
        await categoryCollection.insertOne({ category: category.toLowerCase(), image });
    
        res.status(201).json({ message: 'Category added successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/eachArtistProducts/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { addedBy: email };
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
      const { updatedName, updatedNum, userphoto } = req.body;
      const filter = { email: email }
      const updateDoc = {
        $set: {
          userName: updatedName,
          userPhoneNumber: updatedNum,
          userPhoto: userphoto
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
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
                  totalRating += review.rating;
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
      const sortCriteria = { createdAt: -1 };
      const result = await ordersCollection.find().sort(sortCriteria).toArray();
      res.send(result)
    })
    app.get("/singleOrder/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.findOne(filter);
      res.send(result)
    })


    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result)
    })

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      console.log("to delete order", id);
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);
      res.send(result)
    })

    app.post("/ordersUpdate/:id", async (req, res) => {
      const products = req.body;
      console.log(products);
      const updatePromises = products.map(async product => {
        const query = { _id: new ObjectId(product?.product_id) };
        const updateDocForProduct = {
          $inc: { available_quantity: -product?.quantity } 
        };
        return await productsCollection.updateOne(query, updateDocForProduct);
      });

      // Wait for all product updates to complete
      await Promise.all(updatePromises);

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const transactionId = req.query.transactionId;
      const updateDoc = {
        $set: { transactionId }
      };

      const result = await ordersCollection.updateOne(filter, updateDoc);
      res.send(result);
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


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});









