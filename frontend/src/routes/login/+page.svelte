<script>
      // @ts-nocheck
    import { goto } from '$app/navigation';
    import axios from '../../lib/axios-config'; 
    

    let username = '';
    let password = '';

    export const handleSubmit = async () => {
        try {
        const response = await axios.post('http://localhost:3000/api/auth', {
        username,
        password
        });

        const token = response.data.token;
        document.cookie = `authToken=${token}; path=/; max-age=3600`; 
        goto('/user_management');
        
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
        console.error('Login error:', error.response.data.message); 
        } else {
        console.error('An unknown error occurred:', error.message);
        }
    }
    };

    </script>

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

    <style>
    * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial,
        sans-serif;
        font-size: 16px;
    }
    
    /* .body {
        background-color: #435165;
    } */
    
    .login {
        width: 400px;
        background-color: #ffffff;
        box-shadow: 0 0 9px 0 rgba(0, 0, 0, 0.3);
        margin: 100px auto;
    }
    
    .login h1 {
        text-align: center;
        color: #5b6574;
        font-size: 24px;
        padding: 20px 0;
        border-bottom: 1px solid #dee0e4;
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
        border: 1px solid #dee0e4;
        margin-bottom: 20px;
        padding: 0 15px;
    }
    
    .login form input[type="submit"] {
        width: 100%;
        padding: 15px;
        margin-top: 20px;
        background-color: #3274d6;
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
