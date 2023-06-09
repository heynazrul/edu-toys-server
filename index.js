const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4zbzvmu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const toysCollection = client.db('eduToys').collection('toys');
    const categoriesCollection = client.db('eduToys').collection('categories');

    // creating indexing on Toy name
    // const indexKeys = { toyName: 1 };
    // const indexOptions = { name: 'searchToy' };

    // const result = await toysCollection.createIndex(indexKeys, indexOptions);

    app.get('/searchByToy/:text', async (req, res) => {
      const searchText = req.params.text;
      const query = { toyName: { $regex: searchText, $options: 'i' } };
      const result = await toysCollection.find(query).toArray();
      res.send(result);
    });

    // get total number of toys in database
    app.get('/totalToys', async (req, res) => {
      const result = await toysCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    });

    // get user specific & all toys
    app.get('/toys', async (req, res) => {
      console.log(req.query);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      console.log(!req.headers?.order);
      const order = Number(req.headers.order) || 1;
      console.log(order);

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await toysCollection.find(query).sort({ price: order }).skip(skip).limit(limit).toArray();
      res.send(result);
    });

    app.get('/allToys', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const result = await toysCollection.find().skip(skip).limit(limit).toArray();
      res.send(result);
    });

    app.post('/toys', async (req, res) => {
      let toy = req.body;
      toy = {
        ...toy,
        price: Number(toy.price),
      };
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    });

    app.patch('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { price, quantity, description } = req.body;
      console.log(price, quantity, description);
      const updateDoc = {
        $set: {
          price: Number(price),
          quantity: quantity,
          description: description,
        },
      };

      const result = await toysCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    // get single toy of requested id
    app.get('/toy/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };

      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    // get all toy of requested category
    app.get('/toys/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: category };

      const result = await toysCollection.find(query).toArray();
      res.send(result);
    });

    // category route
    app.get('/categories', async (req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Edu Toys server is running');
});

app.listen(port, () => {
  console.log(`Edu toys is running in port: ${port}`);
});
