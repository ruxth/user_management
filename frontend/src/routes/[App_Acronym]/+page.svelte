<script>
    //@ts-nocheck
    import axios from 'axios';
    import Layout from '../+layout.svelte';
	import Nav from '../../components/nav.svelte';
    import {toast, Toaster} from 'svelte-sonner';

	import { accessError, customSuccess } from '../../utils/handleError';

	import Popup from '../../components/popup.svelte';
	import { onMount } from 'svelte';
	import { faTrainSubway } from '@fortawesome/free-solid-svg-icons';
	import Task from '../../components/task.svelte';

    const apiUrl = import.meta.env.VITE_API_URL;
    export let App_Acronym = ''; 

    let showPlanPopup = false;
	const openPlanPopup = () => {
		showPlanPopup = true;
	};
	const closePlanPopup = () => {
		showPlanPopup = false;
	};

    let showTaskPopup = false;
    const openCreateTaskPopup = (taskState) => {
        showTaskPopup = true;
        getPlans()
    };
    const closeCreateTaskPopup = () => {
		showTaskPopup = false;
	};

    let activePopup = null;
    function openTaskPopup(taskID) {
        activePopup = taskID;
        getPlans();
    }
    function closeTaskPopup() {
        activePopup = null; 
    }

    function formatDate(date) {
        const startDate = new Date(date * 1000);
		return startDate.toISOString().slice(0, 10);
    }

    let groupFlags = {
        isPM: false,
        isPL: false,
        isPermitCreate: false,
        isPermitOpen: false,
        isPermitToDo: false,
        isPermitDoing: false,
        isPermitDone: false
    };
    let appData = [];
	let currentUser = { username: '', email: '' };
    
    onMount(async () => {
        try {
            const userResponse = await axios.get(`${apiUrl}/applications`, {
                withCredentials: true
            });
            currentUser = userResponse.data;
            const groups = currentUser.usergroup.map(item => item.user_group)
            console.log(groups);   
            groupFlags.isPM = groups.includes('PM');
            groupFlags.isPL = groups.includes('PL');
                        
            const response = await axios.post(`${apiUrl}/applications/app`,{
                App_Acronym
            }, {
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
            groupFlags.isPermitCreate = groups.includes(appData.App_permit_Create);  
            groupFlags.isPermitOpen = groups.includes(appData.App_permit_Open);
            groupFlags.isPermitToDo = groups.includes(appData.App_permit_toDoList);
            groupFlags.isPermitDoing = groups.includes(appData.App_permit_Doing);
            groupFlags.isPermitDone = groups.includes(appData.App_permit_Done);                        

            await getTasks();
        } catch (error) {
            if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
        }
    });

    let plan = {
        appAcronym: null,
        planName: '',
        startDate: null,
        endDate: null,
        color: '#ff0000'
    };
    let planList = [];

    const handleAddPlan = async () => {
        plan.appAcronym = appData.App_Acronym;
        
        try {
            const startDate = new Date(plan.startDate);
            plan.startDate = Math.floor(startDate.getTime() / 1000)
            const endDate = new Date(plan.endDate);
            plan.endDate = Math.floor(endDate.getTime() / 1000)
            
            const response = await axios.post(`${apiUrl}/applications/createPlan`, {
                plan
            }, {
                withCredentials: true
            })

            customSuccess('Plan added successfully!')

        } catch (error) {
            if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
        }
    }

    const getPlans = async () => {
        try {
            const response = await axios.get(`${apiUrl}/applications/getPlans`, {
                withCredentials: true
            })
            const plans = response.data
            planList = plans.map((plan) => plan.Plan_MVP_name);              
                      
        }catch (error) {
            if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
        }
    }

    let newTask = {
        taskID: null,
        taskName: '',
        appAcronym: null,
        taskDescription: '',
        planName: '',
        taskState: '',
        taskCreator: null,
        taskOwner: null,
        taskDate: null, 
        taskNotes: [],
    }

    let currentNote = '';
    const formatTaskNote = (note, taskState, username) => {
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        
        return `Date: ${date}, Time: ${time}, Current State: ${taskState}, Noted By: ${username}\nTask Notes: ${note}`;
    };

    const handleAddTask = async () => {
        try {
            const createDate = new Date();
            newTask.taskDate = Math.floor(createDate.getTime() / 1000);
            newTask.appAcronym = appData.App_Acronym;
            newTask.taskOwner = currentUser.username;
            newTask.taskCreator = currentUser.username;
            newTask.taskID = `${appData.App_Acronym}_${appData.App_Rnumber}`;
            newTask.taskState = 'Open';
            if (currentNote.trim()) {
                const formattedNote = formatTaskNote(currentNote.trim(), newTask.taskState, currentUser.username);
                newTask.taskNotes.push(formattedNote); 
                currentNote = ''; 
            }

            const taskNotesJson = JSON.stringify(newTask.taskNotes);
            console.log(newTask);

            const response = await axios.post(`${apiUrl}/applications/createTask`, {
                 newTask: {
                    ...newTask,
                    taskNotes: taskNotesJson 
                }
            }, {
                withCredentials: true
            })
            await getTasks();
            console.log(response.data);
            customSuccess('Task added successfully!')
            
        }catch (error) {
            if (error.response && error.response.data) {
				toast.error(error.response.data.message || 'An unknown error occurred.');
				accessError(error);
			}else {
				toast.error('An unknown error occurred.')
			}
        }
    }

    let taskList = [];

    const getTasks = async () => {
    const appAcronym = appData.App_Acronym;
    
    try {
        const response = await axios.post(`${apiUrl}/applications/getTasks`, {
            appAcronym
        }, {
            withCredentials: true
        });

        taskList = response.data.map(task => {
            task.Task_notes = task.Task_notes.map(note => {
                // Check if the note is an object or a string
                if (typeof note === 'string') {
                    // Handle the string format
                    const parts = note.split('\n');
                    const [dateTimePart, ...taskNoteParts] = parts;
                    const [dateTime, notedBy] = dateTimePart.split(', Noted By: ');
                    let taskNote = taskNoteParts.join('\n').trim();
                    if (taskNote.startsWith('Task Notes:')) {
                        taskNote = taskNote.replace('Task Notes:', '').trim();
                    }

                    const [date, time, state] = dateTime.split(', ').map(part => part.split(': ')[1]);

                    return {
                        date: date || '',
                        time: time || '',
                        state: state || '',
                        notedBy: notedBy || '',
                        taskNote: taskNote || '',
                    };
                } else if (typeof note === 'object') {
                    // Directly return the object if already in the correct format
                    return note;
                } else {
                    // Handle any unexpected formats
                    console.warn('Unexpected note format:', note);
                    return {
                        date: '',
                        time: '',
                        state: '',
                        notedBy: '',
                        taskNote: ''
                    };
                }
            });
            return task;
        });

        console.log('taskList', taskList);
        
    } catch (error) {
        console.error('Error in getTasks:', error);
        if (error.response && error.response.data) {
            toast.error(error.response.data.message || 'An unknown error occurred.');
            accessError(error);
        } else {
            toast.error('Get task an unknown error occurred.');
        }
    }
};

    const handleTaskAction = async (task, action) => {        
        try {            
            const response = await axios.post(`${apiUrl}/applications/updateTask`, {
                taskID: task.Task_id,
                action: action,
                currentState: task.Task_state,
                appAcronym: appData.App_Acronym
            }, {
                withCredentials: true
            })
            await getTasks();
            customSuccess('Task updated successfully!')
        }catch (error) {
            console.error('Error in task action:', error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message || 'An unknown error occurred.');
                accessError(error);
            } else {
                toast.error('tack action an unknown error occurred.');
            }
        }
    }

    const handleSave = async (task) => {
        if (currentNote.trim()) {
            const formattedNote = formatTaskNote(currentNote.trim(), task.Task_state, currentUser.username);
            task.Task_notes.push(formattedNote); 
            currentNote = ''; 
        }
            const taskNotesJson = JSON.stringify(task.Task_notes);
        
        try {
            const response = await axios.post(`${apiUrl}/applications/editTask`, {
                task: {
                    ...task,
                    Task_notes: taskNotesJson 
                }
            }, {
                withCredentials: true
            })
            
            await getTasks();
            customSuccess('Task edited successfully!')
        }catch (error) {
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
    <div class="header">
        <h1>Task Management Board</h1>
        {#if groupFlags.isPM}
        <button class="action2-btn" on:click={openPlanPopup}>+ Create Plan</button>
        {/if}
    </div>
    <Popup show={showPlanPopup} onClose={closePlanPopup}>
        <span slot="header">Create Plan</span>
        <span slot="body">
            <div class="plan-container">
                <div class="info-row" >
                    <label class="info-label" for="appAcronym">App Acronym:</label>
                    <span class="info-value">{appData.App_Acronym}</span>
                </div>
                <div class="info-row">
                    <label class="info-label" for="planName">Plan Name:</label>
                    <input
                        class="info-value"
                        type="text"
                        id="planName"
                        placeholder="Plan Name"
                        bind:value={plan.planName}
                    />
                </div>
                <div class="info-row">
                    <label class="info-label" for="startDate">Start Date:</label>
                    <input
                        class="info-value"
                        type="date"
                        id="startDate"
                        bind:value={plan.startDate}
                    />
                </div>

                <div class="info-row">
                    <label class="info-label" for="endDate">End Date:</label>
                    <input class="info-value" type="date" id="endDate" bind:value={plan.endDate}/>
                </div>
                <div class="info-row">
                    <label class="info-label" for="color">Color:</label>
                    <input class="info-value" type="color" id="color" bind:value={plan.color}>
            </div>
        </div>
    </span>
        <div slot="buttons">
          <button class="action2-btn" on:click={handleAddPlan}>Add Plan</button>
        </div>
    </Popup>


<div class="container">
    <div class="column">
        <div class="column-header">
            <h3>Open</h3>
            {#if groupFlags.isPL || groupFlags.isPermitCreate}
            <button class="action2-btn" on:click={openCreateTaskPopup}>+ Create Task</button>
            {/if}
        </div>
        <Popup show={showTaskPopup} onClose={closeCreateTaskPopup}>
            <span slot="header">Create Task</span>
            <div slot="body">
                <div class="task-container">
                    <div class="task-left">
                        <div class="info-row">
                            <label class="info-label" for="taskID">Task ID</label>
                            <span class="info-value" id="taskID">-</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskName">Task Name:</label>
                            <input
                                class="info-value"
                                type="text"
                                id="taskName"
                                placeholder="Task Name"
                                bind:value={newTask.taskName}
                            />
                        </div>
                        <div class="info-row">
                            <div class="info-label">
                                <label class="info-label" for="taskDescription">Task Description</label>
                                <br/>
                            </div>
                            <textarea
                                    class="info-value description-input"
                                    id="taskDescription"
                                    placeholder="Description"
                                    bind:value={newTask.taskDescription}
                                />
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="planName">Plan Name:</label>
                            <div class="info-select">
                                <select
                                    class="input-value select-box" bind:value={newTask.planName}>
                                    <option value="" disabled selected>Select Group</option>
                                    {#each planList as plan}
                                        <option value={plan}>{plan}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskState">Task State:</label>
                            <span class="info-value">Open</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskCreator">Task Creator:</label>
                            <span class="info-value">{currentUser.username}</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskOwner">Task Owner:</label>
                            <span class="info-value">-</span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="taskOwner">Task Create Date:</label>
                            <span class="info-value">-</span>
                        </div>
                    </div>
                    <div class="task-right">
                        <div class="info-row">
                            <div class="info-label">
                                <label class="info-label" for="taskComment">Notes</label>
                                <br/>
                                <div class="info-value-notes">
                                    <div  id="notesSection">
                                        <ul class="notes-section">
                                        </ul>
                                    </div>
                                    <textarea
                                        class="comments-input"
                                        id="taskComment"
                                        placeholder="Comments"
                                        bind:value={currentNote}
                                    ></textarea>
                            </div>
                            </div>
                        </div>
                    </div>                    
                </div>
            </div> 
            <div slot="buttons">
                <button class="action2-btn" on:click={handleAddTask}>Add Task</button>
            </div>
        </Popup>
        {#each taskList as task}
            {#if task.Task_state === 'Open'}
                <button class="card" style="border-left: 4px solid {task.Plan_color}" on:click={openTaskPopup(task.Task_id)}>
                    <p>{task.Task_id}</p>
                    <h4>{task.Task_name}</h4>
                    <span class="tag">{task.Task_owner}</span>
                </button>
                {#if activePopup === task.Task_id}
                    <Popup show={activePopup !== null} onClose={closeTaskPopup}>
                        <span slot="header">Task</span>
                        <div slot="body">
                            <div class="task-container">
                                <div class="task-left">
                                    <div class="info-row">
                                        <label class="info-label" for="taskID">Task ID</label>
                                        <span class="info-value" id="taskID">{task.Task_id}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskName">Task Name:</label>
                                        <span class="info-value" id="taskName">{task.Task_name}</span>
                                    </div>
                                    <div class="info-row">
                                        <div class="info-label">
                                            <label class="info-label" for="taskDescription">Task Description</label>
                                            <br/>
                                        </div>
                                        <span class="info-value description-input" id="taskDescription">
                                            {task.Task_description}</span>
                                    </div>
                                    {#if groupFlags.isPM}
                                    <div class="info-row">
                                        <label class="info-label" for="planName">Plan Name:</label>
                                        <div class="info-select">
                                            <select
                                                class="input-value select-box" bind:value={task.Task_plan}>
                                                <option value="" disabled selected>Select Group</option>
                                                {#each planList as plan}
                                                    <option value={plan}>{plan}</option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>
                                    {:else}
                                    <div class="info-row">
                                        <label class="info-label" for="taskPlan">Task Plan</label>
                                        <span class="info-value" >{task.Task_plan}</span>
                                    </div>
                                    {/if}
                                    <div class="info-row">
                                        <label class="info-label" for="taskState">Task State:</label>
                                        <span class="info-value">{task.Task_state}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskCreator">Task Creator:</label>
                                        <span class="info-value">{task.Task_creator}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskOwner">Task Owner:</label>
                                        <span class="info-value">{task.Task_owner}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskOwner">Task Create Date:</label>
                                        <span class="info-value">{formatDate(task.Task_createDate)}</span>
                                    </div>
                                </div>
                                <div class="task-right">
                                    <div class="info-row">
                                        <div class="info-label">
                                            <label class="info-label" for="taskComment">Notes</label>
                                            <br/>
                                            <div class="info-value-notes">
                                                <div class="notes-section-container">
                                                    <ul class="notes-section">
                                                        {#each task.Task_notes as note}
                                                            <li class="notes-section">
                                                                Creator: {note.notedBy} | Date: {note.date} | Time: {note.time} | Current State: {note.state}
                                                                <br>
                                                                <strong>Notes: </strong>{note.taskNote} 
                                                            </li>
                                                        {/each}
                                                    </ul>
                                                </div>
                                                {#if groupFlags.isPermitOpen}
                                                <textarea
                                                    class="comments-input"
                                                    id="taskComment"
                                                    placeholder="Comments"
                                                    bind:value={currentNote}
                                                ></textarea>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </div>                    
                            </div>
                        </div> 
                        <div slot="buttons">
                            {#if groupFlags.isPermitOpen}
                            <button class="action3-btn" on:click={() => handleTaskAction(task, 'promote')}>Release Task</button>
                            <button class="action2-btn" on:click={() => handleSave(task)}>Save Changes</button>
                            {/if}
                        </div>
                    </Popup>
                {/if}
            {/if}
        {/each}
    </div>
    <div class="column">
        <h3>To Do</h3>
        {#each taskList as task}
            {#if task.Task_state === 'ToDo'}
                <button class="card" style="border-left: 4px solid {task.Plan_color}" on:click={openTaskPopup(task.Task_id)}>
                    <p>{task.Task_id}</p>
                    <h4>{task.Task_name}</h4>
                    <span class="tag">{task.Task_owner}</span>
                </button>
                {#if activePopup === task.Task_id}
                    <Popup show={activePopup !== null} onClose={closeTaskPopup}>
                        <span slot="header">Task</span>
                        <div slot="body">
                            <div class="task-container">
                                <div class="task-left">
                                    <div class="info-row">
                                        <label class="info-label" for="taskID">Task ID</label>
                                        <span class="info-value" id="taskID">{task.Task_id}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskName">Task Name:</label>
                                        <span class="info-value" id="taskName">{task.Task_name}</span>
                                    </div>
                                    <div class="info-row">
                                        <div class="info-label">
                                            <label class="info-label" for="taskDescription">Task Description</label>
                                            <br/>
                                        </div>
                                        <span class="info-value description-input" id="taskDescription">
                                            {task.Task_description}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskPlan">Task Plan</label>
                                        <span class="info-value" >{task.Task_plan}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskState">Task State:</label>
                                        <span class="info-value">{task.Task_state}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskCreator">Task Creator:</label>
                                        <span class="info-value">{task.Task_creator}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskOwner">Task Owner:</label>
                                        <span class="info-value">{task.Task_owner}</span>
                                    </div>
                                    <div class="info-row">
                                        <label class="info-label" for="taskOwner">Task Create Date:</label>
                                        <span class="info-value">{formatDate(task.Task_createDate)}</span>
                                    </div>
                                </div>
                                <div class="task-right">
                                    <div class="info-row">
                                        <div class="info-label">
                                            <label class="info-label" for="taskComment">Notes</label>
                                            <br/>
                                            <div class="info-value-notes">
                                                <div class="notes-section-container">
                                                    <ul class="notes-section">
                                                        {#each task.Task_notes as note}
                                                            <li class="notes-section">
                                                                Creator: {note.notedBy} | Date: {note.date} | Time: {note.time} | Current State: {note.state}
                                                                <br>
                                                                <strong>Notes: </strong>{note.taskNote} 
                                                            </li>
                                                        {/each}
                                                    </ul>
                                                </div>
                                                {#if groupFlags.isPermitToDo}
                                                <textarea
                                                    class="comments-input"
                                                    id="taskComment"
                                                    placeholder="Comments"
                                                    bind:value={currentNote}
                                                ></textarea>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </div>                    
                            </div>
                        </div> 
                        <div slot="buttons">
                            {#if groupFlags.isPermitToDo}
                            <button class="action3-btn" on:click={() => handleTaskAction(task, 'promote')}>Take on Task</button>
                            <button class="action2-btn" on:click={() => handleSave(task)}>Save Changes</button>
                            {/if}
                        </div>
                    </Popup>
                {/if}
            {/if}
        {/each}
    </div>
    <div class="column">
        <h3>Doing</h3>
        {#each taskList as task}
            {#if task.Task_state === 'Doing'}
            <button class="card" style="border-left: 4px solid {task.Plan_color}">
                <p>{task.Task_id}</p>
                <h4>{task.Task_name}</h4>
                <span class="tag">{task.Task_owner}</span>
            </button>
            {/if}
        {/each}
    </div>
    <div class="column">
        <h3>Done</h3>
        {#each taskList as task}
            {#if task.Task_state === 'Done'}
            <button class="card" style="border-left: 4px solid {task.Plan_color}">
                <p>{task.Task_id}</p>
                <h4>{task.Task_name}</h4>
                <span class="tag">{task.Task_owner}</span>
            </button>
            {/if}
        {/each}
    </div>
    <div class="column">
        <h3>Closed</h3>
        {#each taskList as task}
            {#if task.Task_state === 'Closed'}
            <button class="card" style="border-left: 4px solid {task.Plan_color}">
                <p>{task.Task_id}</p>
                <h4>{task.Task_name}</h4>
                <span class="tag">{task.Task_owner}</span>
            </button>
            {/if}
        {/each}
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

    .action3-btn {
        background-color: rgb(48, 182, 52);
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
        font-weight: 600;
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
		padding: 5px;
		font-size: 16px;
		border: 1px solid #ccc;
		box-sizing: border-box;
        overflow-y: auto;
	}

    .description-input {
        height: 90px;
        width: 90%;
        font-size: 16px;
    }

	.select-box {
		border: none;
		padding: 0px;
		width: 100%;
	}

    .task-container {
        display: flex;
        width: 1200px;
    }

    .task-left {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding-right: 20px;
        border-right: 1px solid black;
    }

    .task-right {
        width: 675px;
        padding-left: 20px;
    }

    .info-value-notes {
        width: 100%;
        height: 400px;
		margin: 5px;
		display: flex;
        flex-direction: column;
        overflow: hidden;
	}

    .notes-section-container {
        flex:1; /* Allows the notes section to grow and take up available space */
        overflow-y: auto; /* Enables scrolling for the notes section */
    }

    ul {
        list-style-type: none; 
        padding: 0; 
        margin: 0; 
    }

    li {
        word-wrap: break-word; /* Break long words to avoid overflow */
        overflow-wrap: break-word; /* Ensures proper word wrapping */
        white-space: normal;
        font-weight: 400;
        margin-bottom: 10px;
        border-bottom: 0.5px solid rgb(149, 149, 149);
    }

    .comments-input {
        height: 70px;
        width: 95%;
        font-size: 16px;
        border: 1px solid #ccc;
        position: relative; 
        margin-top: 10px;
    }

    p {
        margin: 0px;
    }

    .plan-container {
        width: 500px;
    }

    .container {
        display: grid;
        grid-template-columns: repeat(5, 1fr); 
        gap: 20px;
        padding: 20px;
    }

    .column {
        background-color: #D8D8D8;
        padding: 15px;
        border-radius: 8px;
        height: 400px; 
        overflow-y: auto; 
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
        width: 100%;
        text-align: left;
        cursor: pointer;
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

</style>