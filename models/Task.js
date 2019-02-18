const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new mongoose.Schema({
  taskName: {type: String, required: false},
  contentData: Schema.Types.Mixed,
  // contentData: { 
  //   0: {
  //     title: {type: String, required: false},
  //     scanner: {type: String, required: false}
  //   }
  // },
  date: {type: String, default: Date.now},
  // userId: {type: String, required: false}
}, { strict: false });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;