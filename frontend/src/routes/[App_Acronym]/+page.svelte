<script>
    //@ts-nocheck
    import axios from 'axios';
    import Layout from '../+layout.svelte';
	import Nav from '../../components/nav.svelte';

	import { accessError, customSuccess } from '../../utils/handleError';

	import Popup from '../../components/popup.svelte';
	import { onMount } from 'svelte';

    const apiUrl = import.meta.env.VITE_API_URL;
    export let App_Acronym = ''; 

    console.log(App_Acronym);

    let showPlanPopup = false;
	const openPlanPopup = () => {
		showPlanPopup = true;
	};
	const closePlanPopup = () => {
		showPlanPopup = false;
	};

    let showTaskPopup = false;
    const openTaskPopup = () => {
        showTaskPopup = true;
    };
    const closeTaskPopup = () => {
		showTaskPopup = false;
	};

    let appData = [];
	let currentUser = { username: '', email: '' };
    

    onMount(async () => {
        try {
            const userResponse = await axios.get(`${apiUrl}/applications`, {
                withCredentials: true
            });
            currentUser = userResponse.data;
            console.log(currentUser);   
            
            const response = await axios.get(`${apiUrl}/applications/${App_Acronym}`, {
                withCredentials: true
            });

            const app = response.data;
            const startDate = new Date(app.App_startDate * 1000);
            const endDate = new Date(app.App_endDate * 1000);
            appData = {
                ...app,
                App_startDate: startDate.toLocaleDateString(),
                App_endDate: endDate.toLocaleDateString()
            };

        } catch (error) {
            console.error('Error fetching app data:', error);
            accessError(error);
        }
    });
    
    let tasks = [
        { App_Acronym: 'APP1', App_Rnumber: 1, taskName: 'Task 1', tag: 'Important' },
        { App_Acronym: 'APP2', App_Rnumber: 2, taskName: 'Task 2', tag: 'Urgent' },
        // Add more tasks as needed
    ];
</script>

<body>
    <Nav appAcronym={App_Acronym} username={currentUser?.username}/>
    <div class="header">
        <h1>Task Management Board</h1>
        <button class="action2-btn" on:click={openPlanPopup}>+ Create Plan</button>
    </div>
    <Popup show={showPlanPopup} onClose={closePlanPopup}>
        <span slot="header">Create Plan</span>
        <span slot="body">
        <div class="info-row" >
          <label class="info-label" for="appAcronym">App Acronym:</label>
          <span class="info-value"> {appData.App_Acronym}</span>
        </div>
        <div class="info-row">
            <label class="info-label" for="planName">Plan Name:</label>
            <input
                class="info-value"
                type="text"
                id="planName"
                placeholder="Plan Name"
            />
        </div>
        <div class="info-row">
            <label class="info-label" for="startDate">Start Date:</label>
            <input
                class="info-value"
                type="date"
                id="startDate"
            />
        </div>

        <div class="info-row">
            <label class="info-label" for="endDate">End Date:</label>
            <input class="info-value" type="date" id="endDate"  />
        </div>
        <div class="info-row">
            <label class="info-label" for="color">Color:</label>
            <input
                class="info-value"
                type="text"
                id="color"
            />
        </div>
    </span>
        <div slot="buttons">
          <button class="action2-btn" >Add Group</button>
        </div>
      </Popup>


<div class="container">
    <div class="column">
        <div class="column-header">
            <h3>Open</h3>
            <button class="action2-btn" on:click={openTaskPopup}>+ Create Task</button>
        </div>
        <Popup show={showTaskPopup} onClose={closeTaskPopup}>
            <span slot="header">Create Task</span>
            <div slot="body">
                <!-- <Application {groupList} applicationData={newApplication} /> -->
                <div class="task-container">
                    <div class="task-left">
                        <div class="info-row">
                            <label class="info-label" for="taskID">Task ID:</label>
                            <input
                                class="info-value"
                                type="text"
                                id="taskID"
                            />
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskName">Task Name:</label>
                            <input
                                class="info-value"
                                type="text"
                                id="taskName"
                                placeholder="Task Name"
                            />
                        </div>
                        <div class="info-row">
                            <div class="info-label">
                                <label class="info-label" for="taskDescription">Task Description</label>
                                <br/>
                            </div>
                            <textarea
                                    class="info-value comments-input"
                                    id="taskDescription"
                                    placeholder="Description"
                                />
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="appPermitTodo">Plan Name:</label>
                            <div class="info-select">
                                <select
                                    class="input-value select-box">
                                    <option value="" disabled selected>Select Group</option>
                                    <!-- {#each groupList as group}
                                        <option value={group}>{group}</option>
                                    {/each} -->
                                </select>
                            </div>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskState">Task State:</label>
                            <span class="info-value">Open</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskCreator">Task Creator:</label>
                            <span class="info-value">Name</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskOwner">Task Owner:</label>
                            <span class="info-value">Name</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskOwner">Task Create Date:</label>
                            <span class="info-value">Date</span>
                        </div>
                    </div>
                    <div class="task-right">
                        <div class="info-row">
                            <div class="info-label">
                                <label class="info-label" for="appDescription">Notes</label>
                                <br/>
                                <textarea
                                    class="info-value comments-input"
                                    id="taskComment"
                                    placeholder="Comments"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
            <div slot="buttons">
                <button class="action2-btn">Add Application</button>
            </div>
        </Popup>
        {#each tasks as task}
            <div class="card">
                <p>{task.App_Acronym}_{task.App_Rnumber}</p>
                <h4>{task.taskName}</h4>
                <span class="tag">{task.tag}</span>
            </div>
        {/each}
    </div>
    <div class="column">
        <h3>To Do</h3>
        <!-- Add cards for "To Do" column -->
    </div>
    <div class="column">
        <h3>Doing</h3>
        <!-- Add cards for "Doing" column -->
    </div>
    <div class="column">
        <h3>Done</h3>
        <!-- Add cards for "Done" column -->
    </div>
    <div class="column">
        <h3>Closed</h3>
        <!-- Add cards for "Closed" column -->
    </div>
</div>
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

    .info-row {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
	}

	.info-label {
		flex: 1;
	}

	.info-value {
		flex: 2;
		padding: 5px;
		position: relative;
	}

    .info-select {
		flex: 2;
		position: relative;
	}

	input.info-value,
	.info-select {
		width: 100%;
		padding: 8px;
		font-size: 16px;
		border: 1px solid #ccc;
		box-sizing: border-box;
	}

	.select-box {
		border: none;
		padding: 0px;
		width: 100%;
	}


    .container {
        display: grid;
        grid-template-columns: repeat(5, 1fr); /* Five columns */
        gap: 20px; /* Space between columns */
        padding: 20px;
    }

    .column {
        background-color: #D8D8D8;
        padding: 15px;
        border-radius: 8px;
        height: 400px; /* Adjust height as needed */
        overflow-y: auto; /* Scroll if content overflows */
    }

    .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .column h3 {
        margin-bottom: 10px;
        font-size: 16px;
    }

    .card {
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 10px;
    }

    .card h4 {
        margin: 5px 0;
    }

    .tag {
        display: inline-block;
        padding: 5px;
        background-color: #e0e0e0; /* Light gray */
        border-radius: 3px;
        font-size: 12px;
        margin-top: 5px;
    }

    .task-container {
        display: flex;
        width: 1000px;
    }

    .task-left {
        display: flex;
        flex-direction: column;
        flex: 1.2;
        padding-right: 20px;
        border-right: 1px solid black;
    }

    .task-right {
        flex: 2;
        padding-left: 20px;
    }

    .comments-input {
        height: 50px;
        width: 90%;
        font-size: 16px;
        border: 1px solid #ccc;
    }

</style>