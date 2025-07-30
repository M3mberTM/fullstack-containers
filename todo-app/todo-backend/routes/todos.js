const express = require('express');
const { getAsync, setAsync } = require('../redis');
const { Todo } = require('../mongo')
const router = express.Router();

router.get('/statistics', async (_, res) => {
	const todo_counter = await getAsync('added_todos')
	if (todo_counter) {
		res.json({added_todos: todo_counter})
		return
	} else {
		res.json({added_todos: '0'})
	}
})
/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
	const todo = await Todo.create({
		text: req.body.text,
		done: false
	})
	const todos_counter = await getAsync('added_todos')
	let converted
	if (todos_counter) {
		converted = parseInt(todos_counter)
	} else {
		converted = 0
	}	
	const new_todo_counter = converted + 1
	await setAsync('added_todos', new_todo_counter.toString())
	res.send(todo);
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
	res.send(req.todo)
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
	const body = req.body
	const updated = await Todo.findByIdAndUpdate(req.todo._id, body, {new: true})
	res.send(updated)
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
