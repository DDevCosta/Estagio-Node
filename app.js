require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const { flash } = require('express-flash-message');
const session = require('express-session');
const mongoose = require('mongoose'); // Adicionado para a conexão com o banco de dados
const passport = require('passport'); // Adicionado para autenticação
const bodyParser = require('body-parser'); // Adicionado para analisar os corpos das solicitações
const LocalStrategy = require('passport-local').Strategy;

const connectDB = require('./server/config/db');
const User = require('./server/models/User'); // Adicionado para o modelo de usuário

const app = express();
const port = process.env.PORT || 5000;

// Conectar ao Banco de Dados
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static('public'));

// Sessão Express
app.use(
  session({
    secret: 'segredo',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
    },
  })
);

// Mensagens Flash
app.use(flash({ sessionKeyName: 'flashMessage' }));

// Motor de Modelagem
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Configuração do Passport (Autenticação)
app.use(require('express-session')({
  secret: 'Rusty é um cachorro',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Rotas
app.use('/', require('./server/routes/customer'));

// Middleware de Autenticação
function estáLogado(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// ROTAS

// Altere a rota padrão para a página de login
app.get('/', function (req, res) {
  res.render('login');
});

// Exibindo a página secreta
app.get('/secreta', estáLogado, function (req, res) {
  res.render('secreta');
});

// Exibindo o formulário de registro
app.get('/registrar', function (req, res) {
  res.render('registrar');
});



// Lidando com o registro do usuário
app.post('/registrar', async (req, res) => {
  try {
    const usuário = await User.create({
      username: req.body.username,
      password: req.body.password,
    });

    // Redirecionar para a página principal após o registro bem-sucedido
    res.redirect('/');
  } catch (erro) {
    res.status(400).json({ erro });
  }
});

// Exibindo o formulário de login
app.get('/login', function (req, res) {
  res.render('login');
});

// Lidando com o login do usuário
app.post('/login', async function (req, res) {
  try {
    const usuário = await User.findOne({ username: req.body.username });
    if (usuário) {
      const resultado = req.body.password === usuário.password;
      if (resultado) {
        // Redirecionar para a página principal após o login bem-sucedido
        res.redirect('/');
      } else {
        res.status(400).json({ erro: 'Senha não corresponde' });
      }
    } else {
      res.status(400).json({ erro: 'Usuário não existe' });
    }
  } catch (erro) {
    res.status(400).json({ erro });
  }
});

app.get('/logout', function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login'); // Redirecionar para a página de login após o logout
  });
});



var porta = process.env.PORT || 5000;
app.listen(porta, function () {
  console.log('Servidor Iniciado!');
});
