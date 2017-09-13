// Express
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt-as-promised');

// Express-Session
var session = require('express-session');
var sessionStore = new session.MemoryStore;
app.use(session({
    cookie: { maxAge: 60000 },
    store: sessionStore,
    saveUninitialized: true,
    resave: true,
    secret: 'secret'
}));



// Flash
var flash = require('express-flash');
app.use(flash());

// Static Folder
app.use(express.static( path.join(__dirname, 'public')));

// Debugger
// var morgan = require('morgan');
// morgan('tiny');

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}))

// EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tester');

let UserSchema = new mongoose.Schema({
    first_name: { 
        type: String,
        required: [true, 'Please include your first name.'] 
    },
    last_name: { 
        type: String, 
        required: [true, 'Please include your last name.'] 
    },
    birthdate: { 
        type: Date, 
        required: [true, 'Please include your birthdate.'] 
    },
    email: { 
        type: String, 
        required: [true, 'Please include your email.'] 
    },
    password: { 
        type: String, 
        required: [true, 'Please include your password.'] 
    },
    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now }
})
UserSchema.pre('save', function(next){
    bcrypt.hash(this.password, 10)
    .then((hashed_password) => {
        this.password = hashed_password;
        next();
    })
    .catch(err => console.log(err));
}, function(err){
    console.log(err);
});

let User = mongoose.model('User', UserSchema);

// Routes
app.get('/', (req, res, next) => { 
    console.log("GET | '/'");
    return res.render('landing', {
        registrationErrors: req.flash('registrationErrors')[0] || null,
        registrationSuccess: req.flash('registrationSuccess')[0] || null,
        loginMessage: req.flash('loginMessage')[0] || null
    });
});

app.get('/dashboard', (req, res, next) => {
    console.log("GET | '/dashboard'");
    console.log("Session Id:", req.session.user_id);
    User.findById(req.session.user_id, (err, user) => {
        if (err) {
            console.log("ERROR -------")
            return console.log(err)
        } else if (user) {
            console.log("FOUND ++++++++++ ", user)
            return res.render('dashboard', {
                first_name: user.first_name,
                email: user.email,
                stuff: req.flash('test')
            });
        } else {
            console.log("OTHER ----------")
            return res.redirect('/');
        }
    })
   
})

app.get('/sessions/destroy', (req,res,next)=>{
    req.session.destroy((err)=>{
        return res.redirect('/');
    })
})

app.post('/sessions', (req, res, next) => {
    console.log("POST | '/sessions' | req.body: ", req.body);
    User.findOne({email:req.body.email}, (err, user) => {
        if (err) {
            return res.redirect('/');
        }
        else if (user){
            bcrypt.compare(req.body.password, user.password)
            .then( truth => {
                console.log("TRUE : @@@@@@@@ ", truth );req.session.user_id = user._id;
                return res.redirect('/dashboard');
            })
            .catch( err => {
                req.flash('loginMessage', 'Invalid Login Credentials.')
                return res.redirect('/');
            })
        }
    })
})

app.post('/users', (req, res, next)=>{
    console.log("POST | '/users' | req.body: ", req.body);
    userInstance = new User(req.body);
    userInstance.save((err, user)=>{
        if (err) {
            req.flash('registrationErrors', err);    
            return res.redirect('/');
        }
        req.flash('registrationSuccess', 'You have successfully registered.');
        return res.redirect('/');
    })      
})



// Server Listening
app.listen(1337, ()=>{ 
    console.log("Running at 1337")
})