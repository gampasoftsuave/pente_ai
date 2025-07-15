const mongoose = require('mongoose');
const createCRUDController = require('../../middlewaresControllers/createCRUDController');

const create = require('./create');
const addNote = require('./addNote');
const removeNote = require('./removeNote');
const summary = require('./summary');
const editNote = require('./editNote');

function modelController() {
  const Model = mongoose.model('Query');
  const methods = createCRUDController('Query');

  // Override the create method with custom logic
  methods.create = (req, res) => create(Model, req, res);
  methods.addNote = (req, res) => addNote(Model, req, res);
  methods.removeNote = (req, res) => removeNote(Model, req, res);
  methods.summary = (req, res) => summary(Model, req, res);
  methods.editNote = (req, res) => editNote(Model, req, res);
  
  return methods;
}

module.exports = modelController();
