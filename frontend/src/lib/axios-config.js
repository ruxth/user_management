import axios from 'axios';

const instance = axios.create({
	baseURL: 'http://localhost:3000', // Adjust if your server URL changes
	headers: {
		'Content-Type': 'application/json'
	}
});

export default instance;
