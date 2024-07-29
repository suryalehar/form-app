const express = require('express'); // for using express
const mongoose = require('mongoose'); // for using mongoose
const app = express(); // express app that we are going to run as server
const port = 8011; // port upon which the APIs need to be triggered and the server will be running

// schema defined for the questions that we will take as input while creating the form
const questionSchema = new mongoose.Schema({
  question: String,
  options: {
    type: [String], 
    default: []
  },
  formName: String
})

// schema defined for the responses that a user would give while filling the form
const responseSchema = new mongoose.Schema({
  question: String,
  options: {
    type: [String], 
    default: []
  },
  formName: String,
  userId: String
})

const Questions = mongoose.model('Questions', questionSchema); // mongoose model created to map to the questions doc in mongodb

const Responses = mongoose.model('Responses', responseSchema); // mongoose model created to map to the responses doc in mongodb

// connecting to the mongodb database using mongoose
mongoose.connect('mongodb://localhost:27017/form-backend', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// using the json module from express for parsing requests and responses in the APIs
app.use(express.json());

// welcome API
app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

// GET API used for obtaining all the question docs for viewing the form
app.get('/questions', (req, res) => {
  const formName = req.headers["form-name"] // we are picking the form name from the headers as we want to denote which question belongs to which form
  Questions.find({formName: formName})
    .then(questions => {
      const filteredQuestions = questions.map((question) => {
        const filteredQuestion = {"question": question.get("question"), "options": question.get("options")} // to remove the extra indentifiers which are being added my mongo DB and not required by us
        return filteredQuestion
      })
      res.status(200).json(filteredQuestions);
    })
    .catch(err => {
      console.error('Error fetching users:', err);
    });
});

// POST API used for adding a new question to the questions doc for creating/updating the form
app.post('/question', (req, res) => {
  const formName = req.headers["form-name"] // we are picking the form name from the headers as we want to denote which question belongs to which form while adding it
  const newQuestion = new Questions(req.body);
  newQuestion.formName = formName

  newQuestion.save()
    .then(savedQuestion => {
      const filteredQuestion = {"question": savedQuestion.get("question"), "options": savedQuestion.get("options")} // to remove the extra indentifiers which are being added my mongo DB and not required by us
      res.status(201).json(filteredQuestion)
    })
    .catch(err => {
      console.error('Error saving user:', err);
    })
});

// POST API used for adding the responses that a user gives for a given form, options selected can be one or many
// TODO: handle duplicate responses -> if the same question comes with diff options, update them, if not, let them be and if it's a new question, add it
app.post('/response', (req, res) => {
  const formName = req.headers["form-name"]
  const userId = req.headers["user-id"]

  const retResponses = []

  req.body.forEach((body => {
    const newResponse = new Responses(body);
    newResponse.formName = formName
    newResponse.userId = userId
  
    console.log(newResponse)
  
    newResponse.save()
      .then(savedResponse => {
        const filteredResponse = {"question": savedResponse.get("question"), "options": savedResponse.get("options")} // to remove the extra indentifiers which are being added my mongo DB and not required by us
        retResponses.push(filteredResponse)
        console.log(retResponses)
      })
      .catch(err => {
        console.error('Error saving user:', err);
      })
  }));

  // we have set a timeout of 1s as the above save operation is asynchronous and we need to return the responses after saving
  setTimeout(() => {
    console.log('RetResponses: ', retResponses);
    res.status(201).json(retResponses)
  }, 1000);
});

// starting the express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});