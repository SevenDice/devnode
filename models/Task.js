const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new mongoose.Schema({
  taskName: {type: String, required: false},
  contentData: {
    0: {
      title: {type: String, required: false},
      //scanner
    }
  },
  date: {type: String, default: Date.now},
  // userId: {type: String, required: false}
}, { strict: false });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;