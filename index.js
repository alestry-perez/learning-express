import Express from 'express';
import Products from './products.js';

const app = Express();
const port = 3000;

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

const mid = (req, res, next) => {
  console.log(req.query);
  console.log(req.params);
  next();
};

// * GET, PUT, POST, DELETE * //
// Get Information
app.get('/products/:id', mid, (req, res) => {
  res.json(
    Products.find((product) => {
      return +req.params.id === product.id;
    })
  );
  // res.send(req.params.id);
  // res.json(Products);
});

// Add Information
app.post('/add', (req, res) => {
  console.log(req.body.id);
  res.sendStatus(200);
});

app.listen(port, () => console.log('port listening!' + port));
