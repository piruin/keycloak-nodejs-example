var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var Keycloak = require('keycloak-connect');
var cors = require('cors');

var app = express();
app.use(bodyParser.json());
app.use(cors());

var memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'some very long secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

var keycloak = new Keycloak({
  store: memoryStore
});

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));


// # Public resource

app.get('/public', function (req, res) {
  res.json({message: 'public'});
});

// # Simple authentication
//
// To enforce that a user must be authenticated before accessing a resource,
// simply use a no-argument version of keycloak.protect():
app.get('/user', keycloak.protect(), function (req, res){
  res.json({message: 'user'});
});

// # Role-Based Authorization
//
// secure a resource with a realm roles
app.get('/roles/admin', keycloak.protect('realm:admin'), function (req, res) {
  res.json({message: 'admin'});
});

app.get('/roles/advertiser', keycloak.protect('realm:customer-advertiser'), function (req, res) {
  res.json({message: 'advertiser'});
});

app.get('/roles/analyst', keycloak.protect('realm:customer-analyst'), function (req, res) {
  res.json({message: 'analyst'});
});

// many role can access reousece
app.get('/roles/adminOrAdvertiser', keycloak.protect(['realm:admin', 'realm:customer-advertiser']), function (req, res) {
  res.json({message: 'admin, advertiser'});
});

// secure a resource with current client roles
app.get('/roles/manager', keycloak.protect('manager'), function (req, res) {
  res.json({message: 'manager'});
});

// # Resource-Based Authorization
//
// Use keycloak.enforcer to control the access of resource with 'resource[:scope]' format
// example for 'customer:view' for resource 'customer' with 'view' scope
app.get('/customers', keycloak.enforcer('customer:view'), function (req, res) {
  res.json({message: 'customer'});
});

app.post('/customers', keycloak.enforcer('customer:create'), function (req, res) {
  res.status(201).json({message: 'customer created'})
})

app.get('/campaigns', keycloak.enforcer('campaign:view'), function (req, res) {
  res.json({message: 'campaign'});
});

app.post('/campaigns', keycloak.enforcer('campaign:create'), function (req, res) {
  res.status(201).json({message: 'campaign created'})
})

app.get('/reports', keycloak.enforcer('report:view'), function (req, res) {
  res.json({message: 'report'});
});

app.post('/reports', keycloak.enforcer('report:create'), function (req, res) {
  res.status(201).json({message: 'report created'})
})

// require more than one permssion to access resource
app.put('/customers/:id/reports', keycloak.enforcer(['customer:view','report:create']), function (req, res) {
  res.status(201).json({message: 'customer-report created'})
})

app.use('*', function (req, res) {
  res.status(404).json({code: '404', message: 'Not found'})
});

app.listen(3000, function () {
  console.log('Started at port 3000');
});
