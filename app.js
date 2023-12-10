// Setup server, session and middleware here.
import express from 'express';
const app = express();
import session from 'express-session';
import configRoutes from './routes/index.js';
import exphbs from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import validate from './validation.js';
import { users } from './config/mongoCollections.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticDir = express.static(__dirname + '/public');
const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  // let the next middleware run:
  next();
};

app.use('/public', staticDir);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rewriteUnsupportedBrowserMethods);

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(
  session({
    name: 'AuthState',
    secret: "This is a secret.. shhh don't tell anyone",
    saveUninitialized: false,
    resave: false
  })
);
// 1. Logging middleware for the root route
app.use('/check-auth', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect based on user role

  if (req.session.user) {
    console.log('valid user');
    if (req.session.user.role === 'admin') {
      console.log('redirecting to admin');
      res.redirect('/admin');

      //res.render('admin');
    } else {
      console.log('redirecting to protected');
      res.redirect('/protected');

      //res.render('protected');
    }
  } else {
    next();
  }
});

// 2. Middleware for GET /login route
app.use('/login', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect based on user role
  if (req.session.user) {
    if (req.session.user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/protected');
    }
  } else {
    next();
  }
});

// 3. Middleware for GET /register route
app.use('/register', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect based on user role
  if (req.session.user) {
    if (req.session.user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/protected');
    }
  } else {
    next();
  }
});

// 4. Middleware for GET /protected route
app.use('/protected', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  if (!req.session.user) {
    //res.redirect('/login');
    res.status(401).render('error', { error: '401 - You have not authenticated' });
  } else {
    next();
  }
});

// 5. Middleware for GET /admin route
app.use('/admin', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  if (!req.session.user) {
    //res.redirect('/login');
    res.status(401).render('error', { error: '401 - You have not authenticated' });
  } else {
    // Check if the user is an admin
    if (req.session.user.role !== 'admin') {
      res.status(403).render('error', { error: '403 - Permission Denied' });
    } else {
      //res.render('admin');
      next();
    }
  }
});

// 6. Middleware for GET /logout route
app.use('/logout', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
});

app.use('/habits/create-habit', (req, res, next) => {
app.use('/groups', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  console.log("I am in groups");
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    console.log("I am in next group")
    next();
  }
  //console.log("I am out")
  //next();
});

app.use('/users', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  console.log("I am in user");
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    console.log("I am in next user")
    next();
  }
  //console.log("I am out")
  //next();
});

app.use('/challenges', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
});

app.use('tracked-habits/view-habit-log', (req, res, next) => {
  // Redirect to login if not logged in
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
});

    console.log("I am in challenges")
    next();
  }
  //console.log("I am out")
  //next();
});

app.use('/individual', (req, res, next) => {
  console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${req.session.user ? 'Authenticated User' : 'Non-Authenticated User'})`);
  // Redirect to login if not logged in
  console.log("I am in individual");
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    console.log("I am in next individual")
    next();
  }
  //console.log("I am out")
  //next();
});




// Configure other routes
configRoutes(app);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`You have a new server running on http://localhost:${PORT}`);
});

