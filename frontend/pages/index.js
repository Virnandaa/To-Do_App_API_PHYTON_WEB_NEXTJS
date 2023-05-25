import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import MyMenu from "../components/menu";

export default function Home() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [token, setToken] = useState("");
	const [todos, setTodos] = useState();
	const [inputTask, setInputTask] = useState("");
	const [loggedUser, setLoggedUser] = useState({});

	// API calls
	const getTodos = async (token) => {
		try {
			const response = await fetch("http://localhost:5000/todos", {
				headers: {
					Authorization: `Token ${token}`,
				},
			});

			const data = await response.json();

			if (response.ok) return data.todos;
			else throw new Error(data.error);
		} catch (error) {
			console.error("Error fetching todos:", error);
			return null;
		}
	};

	// TODO: add, complete, uncomplete, delete
	const postTodo = async (token, todoName) => {
		try {
			const response = await fetch("http://localhost:5000/todos", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Token ${token}`,
				},
				body: JSON.stringify({ body: todoName }),
			});
      // console.log(data);
			const data = await response.json();
      console.log(data);

			if (response.ok) return data.todo;
			else throw new Error(data.error);
		} catch (error) {
			console.error(error);
			return null;
		}
	};

	const updateTodo = async (token, todoId, status) => {
		try {
			const response = await fetch(`http://localhost:5000/todo/${todoId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ status }),
			});

			const data = await response.json();
			if (response.ok) return data.todo;
			else throw new Error(data.error);
		} catch (error) {
			console.error(error);
			return null;
		}
	};

	const deleteTodo = async (token, todoId) => {
		try {
			const response = await fetch(`http://localhost:5000/todo/${todoId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Token ${token}`,
				},
			});

			const data = await response.json();

			if (response.ok) return data;
			else throw new Error(data.error);
		} catch (error) {
			console.error(error);
			return null;
		}
	};

	// Functions
	const addTask = async (taskName) => {
		const addedTodo = await postTodo(token, taskName);
    
		if (addedTodo != null) {
			let addedTodoId = addedTodo.id;

			setTodos((prevTodos) => {
				const newTodo = { id: addedTodoId, body: taskName, status: "pending" };
				return [...prevTodos, newTodo];
			});
		}
	};

	function parseJwt(token) {
		if (!token) {
			return;
		}
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace("-", "+").replace("_", "/");
		return JSON.parse(window.atob(base64));
	}

	const toggleCompleteTask = async (todoId, status) => {
		const updatedTodo = await updateTodo(token, todoId, status);

		if (updatedTodo != null) {
			let updatedTodoId = updatedTodo.id;

			setTodos((prevTodos) => {
				const newTodos = [...prevTodos];
				let todoToUpdate = newTodos.find((todo) => todo.id == updatedTodoId);
				if (todoToUpdate) todoToUpdate.status = status;
				return newTodos;
			});
		}
	};

	const deleteTask = async (todoId) => {
		const deletedTodo = await deleteTodo(token, todoId);

		if (deletedTodo != null) {
			setTodos((prevTodos) =>
				prevTodos.filter((todo) => todo.id != todoId)
			);
		}
	};

	const addTaskClicked = () => {
		if (inputTask) addTask(inputTask);
		setInputTask("");
	};

	// Logout
	useEffect(() => {
		if (router.query.logout && router.query.logout == 1) {
			setToken("");
			setLoggedUser({});
			localStorage.removeItem("token");
			router.push("/login");
		}
	}, [router.query.logout]);

	// Pageload
	useEffect(() => {
		const storedToken = localStorage.getItem("token");

		const checkToken = async () => {
			if (storedToken) {
				// api call to get todos/validate storedToken
				const todos = await getTodos(storedToken);
				if (todos) {
					setTodos(todos);
					setToken(storedToken);
					setLoggedUser(parseJwt(storedToken));
				} else {
					router.push("/login"); // invalid token
				}
			} else {
				router.push("/login"); // token is not set
			}

			setLoading(false);
		};

		checkToken();
	}, []);

	if (loading) {
		return (
			<>
				<Head>
					<title>Todo App</title>
					<meta name="description" content="This is my todo app" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<main className={styles.main}>
					<div className={styles.loading}>Loading...</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Head>
				<title>Todo App</title>
				<meta name="description" content="This is my todo app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<MyMenu user={loggedUser} />
			<main className={styles.main}>
				<div className={styles.todoApp}>
					<div className={styles.todoContainer}>
						<section className={styles.inputContainer}>
							<input
								className={styles.inputTask}
								type="text"
								placeholder="Add new task..."
								value={inputTask}
								onChange={(e) => setInputTask(e.target.value)}
							/>
							<button className={styles.addTask} onClick={addTaskClicked}>
								Add
							</button>
						</section>
						<section className={`${styles.listContainer} ${styles.noselect}`}>
							<ul className={styles.activeList}>
								{todos &&
									todos.map((todo) => {
										if (todo.status !== "completed") {
											return (
												<li
													onClick={(e) =>
														toggleCompleteTask(todo.id, "completed")
													}
													key={todo.id}
												>
													{todo.body}
													<button
														className={styles.deleteButton}
														onClick={(e) => deleteTask(todo.id)}
													>
														Delete
													</button>
												</li>
											);
										} else if (todo.status === "completed") {
                      return (
												<li
                          className={styles.lineThrough}
													onClick={(e) =>
														toggleCompleteTask(todo.id, "pending")
													}
													key={todo.id}
												>
													{todo.body}
													<button
														className={styles.deleteButton}
														onClick={(e) => deleteTask(todo.id)}
													>
														Delete
													</button>
												</li>
											);
										}
									})}
							</ul>
						</section>
					</div>
				</div>
			</main>
		</>
	);
}
