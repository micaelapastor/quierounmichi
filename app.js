const express = require('express'); // Dependencia para servir el sitio web
const exphbs = require('express-handlebars'); // Dependencia para los layouts y templates HBS
const bodyParser = require("body-parser"); // Dependencia para manejar datos POST
const multer = require('multer'); // Dependencia para manejar datos POST con file upload (multipart/form-data)
const sharp = require('sharp'); // Dependencia para resizear imagenes
const mongo = require('mongodb'); // Dependencia para la conexión a base de datos Mongo

const app = express(); // Creación de la instancia de express
const upload = multer({ dest: 'uploads/' });

const url = "mongodb+srv://mica11:FhergvrVPoaLSNfb@mica-bsys9.gcp.mongodb.net/qumichi?retryWrites=true&w=majority"; // Definición de la URL MongoDB
const client = new mongo.MongoClient(url, { useUnifiedTopology: true }); // Creación del cliente de MongoDB

const hbs = exphbs.create({ // Definición de la configuración para Handlebars
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts', // Definición de la carpeta para los layouts
  defaultLayout: 'main', // Layout por defecto
});

app.engine('hbs', hbs.engine); // Definición del motor de vista HBS
app.set('views', __dirname + '/views'); // Definición de la carpeta para las vistas
app.set('view engine', 'hbs');
app.use('/public', express.static(__dirname + '/public')); // Definición del directorio de archivos estáticos (css, js, img)
app.use(bodyParser.urlencoded({ extended: true })); // Uso del bodyParser para leer el body de una request POST

var dbo;

client.connect(function (err, db) { // Conectamos a Mongo
  if (err) throw err;
  dbo = db.db("qumichi"); // Selecionamos la database, mantenemos el objeto en la variable dbo para su uso posterior
});

app.get('/', (req, res) => {
  dbo.collection("cats").find().toArray((err, items) => {
    if (err) throw err;
    res.render('index', { layout: false, cats: items });
  });
});

app.get('/detail/:id', (req, res) => {
  dbo.collection("cats").findOne({ _id: mongo.ObjectID(req.params.id) }, function (err, item) {
    if (err) throw err;

    if (item == null) {
      return false;
    }

    res.render('catdetail', { layout: false, cat: item });
  });
});

app.post('/contactform', (req, res) => {
  var contact = { name: req.body.name, email: req.body.email, phone: req.body.phone, message: req.body.message, catdesc: req.body.catdesc };

  dbo.collection("contact").insertOne(contact, function (err, docsInserted) {
    if (err) throw err;
  });

  res.end('');
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.get('/admin/newcat', (req, res) => {
  res.render('newcat');
});

app.post('/admin/newcat', upload.single('photo'), (req, res) => {
  var michi = { name: req.body.name, desc: req.body.desc, age: req.body.age, breed: req.body.breed };

  dbo.collection("cats").insertOne(michi, function (err, docsInserted) {
    if (err) throw err;
  });

  var id = michi['_id'];

  sharp(req.file.path)
    .resize(300, 300, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .toFormat('jpeg')
    .toFile('public/cats/' + id + '_thumbnail.jpg', (err, info) => { });

  sharp(req.file.path)
    .resize(1500, 1500, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .toFormat('jpeg')
    .toFile('public/cats/' + id + '.jpg', (err, info) => { });

  res.redirect('/admin/cats')
});

app.get('/admin/cats', (req, res) => {
  dbo.collection("cats").find().toArray((err, items) => {
    if (err) throw err;
    res.render('cats', { cats: items });
  });
});

app.get('/admin/deletecat/:id', (req, res) => {
  dbo.collection('cats').deleteOne({ _id: mongo.ObjectID(req.params.id) }, (err, result) => {
    if (err) throw err;
    res.redirect('/admin/cats')
  })
});

app.get('/admin/contact', (req, res) => {
  dbo.collection("contact").find().toArray((err, items) => {
    if (err) throw err;
    res.render('contact', { contact: items });
  });
});

app.get('/admin/deletecontact/:id', (req, res) => {
  dbo.collection('contact').deleteOne({ _id: mongo.ObjectID(req.params.id) }, (err, result) => {
    if (err) throw err;
    res.redirect('/admin/contact')
  })
});

app.listen(3000, function () {
  console.log('Listening on port 3000. http://localhost:3000/');
});
