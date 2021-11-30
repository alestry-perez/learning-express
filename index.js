import Express from 'express';
import jwt from 'jsonwebtoken';
import Products from './products.js';
import users from './users.js';

const app = Express();
const port = 3000;

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

let refreshTokens = [];

// Custom Middleware
const mid = (req, res, next) => {
  if (Number(req.params.id) < 0) {
    res.send('Error You Messed UP! ++ Numbers Only');
  } else {
    next();
  }
};

// Get Information
app.get('/products/:id', [mid], (req, res) => {
  res.json(
    Products.find((product) => {
      return req.params.id === product.id;
    })
  );
});

// Add Information
app.post('/add', (req, res) => {
  console.log(req.body.id);
  res.sendStatus(200);
});

app.post('/api/refresh', (req, res) => {
  //take the refresh token from the user
  const refreshToken = req.body.token;
  //send error if there is no token or it's invalid
  if (!refreshToken) return res.status(401).json('You are not authenticated!');
  if (!refreshTokens.includes(refreshToken))
    return res.status(403).json('Refresh token is not valid!');
  jwt.verify(refreshToken, 'myRefreshSecretKey', (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.push(newRefreshToken);
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
});

// if everything is ok,
// create new access token,
// refresh token and send to user
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'mySecretKey', {
    expiresIn: '60s',
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'myRefreshSecretKey');
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });
  if (user) {
    // generate password
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {
    return res.status(400).json('Username or Password is incorrect');
  }
});

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'mySecretKey', (err, user) => {
      if (err) return res.status(403).json('Token is not valid!');
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json('You are not authenticated!');
  }
};

app.delete('/api/users/:userId', verify, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json('User has been deleted.');
  } else {
    res.status(403).json('You are not allowed to delete this user!');
  }
});

app.post('/api/logout', verify, (req, res) => {
  const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json('You logged out successfully.');
});

app.listen(port, () => console.log('port listening!' + port));
