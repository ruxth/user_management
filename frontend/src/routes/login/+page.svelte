<script>
    // @ts-nocheck
    import { goto } from '$app/navigation';
    import axios from '../../lib/axios-config';
    import {toast, Toaster} from 'svelte-sonner';
    import {  } from "module";

    let username = '';
    let password = '';

    export const handleSubmit = async () => {
        try {
        const response = await axios.post('http://localhost:3000/api/auth', {
        username,
        password
        }, {
            withCredentials: true
        });

        goto('/applications');
        toast.success('Login successful!');
        
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
        } else {
            toast.error('An unknown error occurred.');
        }
    }
    };

    </script>

    <body>
    <div class="login">
    <h1>Login</h1>
    <form on:submit|preventDefault={handleSubmit}>

        <input
        type="text"
        bind:value={username}
        placeholder="Username"
        id="username"
        required
        />

        <input
        type="password"
        bind:value={password}
        placeholder="Password"
        id="password"
        required
        />
        <input type="submit" value="Login" />
    </form>
    </div>
</body>

    <style>
    * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial,
        sans-serif;
        font-size: 16px;
    }

    body {
        margin: 0px;
    }
    
    .login {
        width: 400px;
        background-color: #ffffff;
        margin: 100px auto;
    }
    
    .login h1 {
        text-align: center;
        color: #5b6574;
        font-size: 24px;
        padding: 20px 0;
    }
    
    .login form {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        padding-top: 20px;
    }
    
    
    .login form input[type="password"],
    .login form input[type="text"] {
        width: 310px;
        height: 50px;
        border: none;
        background-color: #c9c9c9;
        margin-bottom: 20px;
        padding: 0 15px;
    }
    
    .login form input[type="submit"] {
        width: 310px;
        padding: 15px;
        margin-top: 20px;
        background-color: black;
        border: 0;
        cursor: pointer;
        font-weight: bold;
        color: #ffffff;
        transition: background-color 0.2s;
    }
    
    .login form input[type="submit"]:hover {
        background-color: #2868c7;
        transition: background-color 0.2s;
    }
    </style>
