<script>
    //@ts-nocheck
    import {toast, Toaster} from 'svelte-sonner';
	import { accessError, customSuccess } from '../utils/handleError';

    export let task;
    export let planList;
    export let currentUser;
    // export let currentNote;
    export let formatDate;
    export let showPopup = false;
    export let onClose = () => {};
    export let handleReleaseTask;
    // export let handleSave;

    const closePopup = () => {
        onClose();
    };

    let currentNote = '';
    const formatTaskNote = (note, taskState, username) => {
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        
        return `Date: ${date}, Time: ${time}, Current State: ${taskState}, Noted By: ${username}\nTask Notes: ${note}`;
    };

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

{#if showPopup}
    <div class="popup-overlay">
        <div class="popup">
            <h3 class="popup-header">
                Task
            </h3>
            <div class="popup-body">
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
                                {task.Task_description}
                            </span>
                        </div>
                        <div class="info-row">
                            <label class="info-label" for="planName">Plan Name:</label>
                            <div class="info-select">
                                <select class="input-value select-box" bind:value={task.Task_plan}>
                                    <option value="" disabled selected>Select Group</option>
                                    {#each planList as plan}
                                        <option value={plan}>{plan}</option>
                                    {/each}
                                </select>
                            </div>
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
                            <label class="info-label" for="taskCreateDate">Task Create Date:</label>
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
                                                    Notes by: {note.notedBy} | Date: {note.date} | Time: {note.time} | Current State: {note.state}
                                                </li>
                                                <li class="notes-section">
                                                    <strong>Notes: </strong>{note.taskNote} 
                                                </li>
                                            {/each}
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
            <div class="popup-close">
                <button class="action3-btn" on:click={handleReleaseTask}>Release Task</button>
                <button class="action2-btn" on:click={() => handleSave(task)}>Save Changes</button>
                <button class="action-btn" on:click={closePopup}>Cancel</button>
            </div>
        </div>
    </div>
{/if}

<style>
    * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
        'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: scroll;
    }

    .popup {
        background: white;
        padding: 10px 20px;
        border-radius: 5px;
        max-height: 95vh;
        overflow-y: auto; 
        overflow-x: hidden;
    }

    .popup-header {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .popup-close {
        display: flex;
        justify-content: center;
        cursor: pointer;
        margin-top: 30px;
    }

    .action-btn, .action2-btn, .action3-btn {
        background-color: black;
        color: white;
        padding: 8px 12px;
        margin-left: 10px;
        border: none;
        cursor: pointer;
    }

    .action3-btn {
        background-color: rgb(48, 182, 52);
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

    .info-value-notes {
        width: 100%;
        height: 100%;
        margin: 5px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .notes-section-container {
        flex-grow: 1; /* Allows the notes section to grow and take up available space */
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
    }

    .comments-input {
        height: 70px;
        width: 40%;
        font-size: 16px;
        border: 1px solid #ccc;
        position: absolute;  
        bottom: 20%;  
    }
</style>