import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/LoginRegister.module.css";

export default function Register() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const handleRegister = async () => {
		if (username.length < 1 || password.length < 1) {
			alert("Check input!");
			return;
		}

		// Make API call to login endpoint with email and password
		fetch("http://localhost:5000/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) throw new Error(data.error);

				// Successfully created account
				if (confirm("Successfully registered! Want to login?")) {
					router.push("/login");
				}
			})
			.catch((error) => {
				alert(error.message);
			});
	};

	return (
		<>
			<Head>
				<title>Todo App | Register</title>
				<meta name="description" content="This is my todo app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="" />
			</Head>
			<main className={styles.main}>
				<div className={styles.formContainer}>
					<h1>Register</h1>
					<form onSubmit={(e) => e.preventDefault()}>
						<div>
							<label htmlFor="username">Username: </label>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div>
							<label htmlFor="password">Password: </label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<div>
							<p>
								Already have an account?{" "}
								<Link className={styles.linkBasic} href="/login">
									Login
								</Link>
							</p>
						</div>
						<div>
							<button type="submit" onClick={handleRegister}>
								Register
							</button>
						</div>
					</form>
				</div>
			</main>
		</>
	);
}
