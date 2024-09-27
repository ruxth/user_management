<script>
	// @ts-nocheck
	import axios from '../../lib/axios-config';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {toast, Toaster} from 'svelte-sonner';

	import Layout from '../+layout.svelte';
	import { accessError, customSuccess } from '../../utils/handleError';
	import { faEdit } from "@fortawesome/free-solid-svg-icons";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
	import Popup from '../../components/popup.svelte';
	import Nav from '../../components/nav.svelte';
	import Application from '../../components/application.svelte';
	import TMSpage from '../../routes/[App_Acronym]/+page.svelte'

	const apiUrl = import.meta.env.VITE_API_URL;

	let applications = [];
	let newApplication = {
		App_Acronym: '',
		App_Rnumber: 1,
		App_Description: '',
		App_startDate: null, 
		App_endDate: null, 
		App_permit_Create: '',
		App_permit_Open: '',
		App_permit_toDoList: '',
		App_permit_Doing: '',
		App_permit_Done: ''
	};

	const resetFields = () => {
		newApplication = {
		App_Acronym: '',
		App_Rnumber: 1,
		App_Description: '',
		App_startDate: null, 
		App_endDate: null, 
		App_permit_Create: '',
		App_permit_Open: '',
		App_permit_toDoList: '',
		App_permit_Doing: '',
		App_permit_Done: ''
	};
	}
	let currentApplication = null;

	let showCreatePopup = false;
	const openCreatePopup = () => {
		showCreatePopup = true;
	};
	const closeCreatePopup = () => {
		showCreatePopup = false;
		resetFields();
	};

	let showEditPopup = false;
	function openEditPopup(app) {
		currentApplication = { ...app }; 
		showEditPopup = true;
	}
	const closeEditPopup = () => {
		showEditPopup = false;
	};

	export let App_Acronym = '';
	let showTMSPage = false; 
	
	function openTMSpage(Acronym) {
		showTMSPage = true;
		App_Acronym = Acronym;
	}

	function toggleApplications() {
        showTMSPage = false; 
    }

	let isAdmin = false;
	let isPL = false;
	let currentUser = { username: '', email: '' };

	onMount(async () => {
		try {
			const response = await axios.get(`${apiUrl}/applications`, {
				withCredentials: true
			});
			currentUser = response.data;
			const groups = currentUser.usergroup.map(item => item.user_group)
			
			if (groups.includes('Admin')) {
				isAdmin = true;
			}
			if (groups.includes('PL')) {
				isPL = true;
			}
			getAllApplications();
			getAllGroups();
		} catch (error) {
			goto('/login');
		}
	});

	const handleSaveProfile = async (event) => {
		const { username, email, password } = event.detail;
		try {
			const response = await axios.put(
				`${apiUrl}/updateUser/${username}`,
				{ email, password },
				{ withCredentials: true }
			);
			customSuccess('Saved Profile');
			closeCreatePopup();
		} catch (error) {
			if (error.response && error.response.status) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			} else {
				console.log('An unknown error occurred.');
			}
		}
	};

	let userGroups = [];
	let groupList = [];

	const getAllGroups = async () => {
		try {
			const groupsResponse = await axios.get(`${apiUrl}/usergroups`, {
				withCredentials: true
			});
			userGroups = groupsResponse.data;
			groupList = [...new Set(userGroups.map((group) => group.user_group))];
		} catch (error) {
			console.error('Error fetching accounts:', error);
			toast.error('Error fetching accounts:', error);
		}
	};

	const getAllApplications = async () => {
		
		try {
			const response = await axios.get(`${apiUrl}/getAllApplications`,{
				withCredentials: true,
			})
			applications = response.data.map(app => {
			const startDate = new Date(app.App_startDate * 1000);
			const endDate = new Date(app.App_endDate * 1000);
			return {
				...app,
				App_startDate: startDate.toISOString().slice(0, 10),
				App_endDate: endDate.toISOString().slice(0, 10)
    		};
        });
		}catch (error) {
			if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
		}
	}

	const handleAddApplication = async () => {
		try {
			const startDate = new Date(newApplication.App_startDate);
			newApplication.App_startDate = Math.floor(startDate.getTime() / 1000);

			const endDate = new Date(newApplication.App_endDate);
			newApplication.App_endDate = Math.floor(endDate.getTime() / 1000);
			console.log('new application', newApplication)

			const response = await axios.post(`${apiUrl}/newApplication`, {
                newApplication
            }, {
              withCredentials: true
            });
			closeCreatePopup();
			getAllApplications();
			customSuccess('Application added successfully!')
		} catch (error) {
			if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
		}
	};

	const handleEditApplication = async () => {
		try {
			const startDate = new Date(currentApplication.App_startDate);
			currentApplication.App_startDate = Math.floor(startDate.getTime() / 1000);

			const endDate = new Date(currentApplication.App_endDate);
			currentApplication.App_endDate = Math.floor(endDate.getTime() / 1000);
			console.log('edit application', currentApplication)

			const response = await axios.post(`${apiUrl}/editApplication`, {
                currentApplication
            }, {
              withCredentials: true
            });
			closeEditPopup();
			getAllApplications();
			customSuccess('Application edited successfully!')
		} catch (error) {
			if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
		}	
	}
</script>

<body>
	<Nav
		username={currentUser.username}
		email={currentUser.email}
		on:save={handleSaveProfile}
		{isAdmin}
		{showTMSPage}
        toggleApplications={toggleApplications}
	/>
	{#if showTMSPage}
		<TMSpage {App_Acronym}/>
	{:else}
	<div class="header">
		<h1 class="welcome-title">Applications</h1>
		{#if isPL}
			<button class="action2-btn" on:click={openCreatePopup}>+ Create Application</button>
		{/if}
	</div>

	<div class="app-container"> 
		{#each applications as app}
			<button class="app" on:click={openTMSpage(app.App_Acronym)}>
					<p><strong>App Name:</strong> {app.App_Acronym}</p>
					<p class="description-display"><strong>Description:</strong> {app.App_Description}</p>
					<p><strong>Start Date:</strong> {app.App_startDate}</p>
					<p><strong>End Date:</strong> {app.App_endDate}</p>
					{#if isPL}
						<button class="edit-button" on:click={(event) => {
							event.stopPropagation(); 
							openEditPopup(app);
						}}>
						<FontAwesomeIcon icon={faEdit}/>
				</button>
				{/if}
			</button>
			<Popup show={showEditPopup} onClose={closeEditPopup}>
				<span slot="header">Edit Application</span>
				<div slot="body">
					<Application {groupList} applicationData={currentApplication} isEditing=true/>
				</div>
				<div slot="buttons">
					<button class="action2-btn" on:click={handleEditApplication}>Edit Application</button>
				</div>
			</Popup>
		{/each}
	</div>


	<Popup show={showCreatePopup} onClose={closeCreatePopup}>
		<span slot="header">Create Application</span>
		<div slot="body">
			<Application {groupList} applicationData={newApplication} />
		</div> 
		<div slot="buttons">
			<button class="action2-btn" on:click={handleAddApplication}>Add Application</button>
		</div>
	</Popup>
	{/if}
</body>


<style>
	* {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
		'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;
	}
	body {
		margin: 0px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0px 30px;
	}
	.action2-btn {
		background-color: black;
		color: white;
		padding: 8px 12px;
		border: none;
		cursor: pointer;
	}

	p {
		margin: 0px;
	}

	.app-container {
		display: grid;
    	grid-template-columns: repeat(2, 1fr);
		justify-content: space-between;
		padding: 20px;
	}

	.app {
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
		background-color: #D8D8D8;
		border: none;
		padding: 15px;
		width: 90%; 
		cursor: pointer;
		margin-bottom: 20px;
		max-height: 200px;
	}

	.app p {
		margin: 5px 0;
	}

	.description-display {
		height: 40%;
		overflow-y: auto;
	}

	.edit-button {
		position: absolute; 
		top: 20px;
		right: 10px;
		background: none;
		border: none;
		cursor: pointer;
		color: black;
	}

	p {
		margin: 0px;
	}
</style>
