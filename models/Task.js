const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new mongoose.Schema({
  taskName: {type: String, required: true},
  taskCategory: {type: String, required: true},
  contentData: Schema.Types.Mixed,
  date: {type: Date, default: Date.now},
  user: {type: Schema.Types.ObjectId, ref: 'user'}
  // Probably should add status public/private for each task
  // that users can decide what they want to choose
  // it will be hiding user tasks from all users in public solutions
  // contentData: { 
  //   0: {
  //     title: {type: String, required: false},
  //     scanner: {type: String, required: false}
  //   }
  // },
}, { strict: false });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;