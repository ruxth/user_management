<script>
    //@ts-nocheck
	import { createEventDispatcher } from 'svelte';
	
	export let groupList = []; 
	export let applicationData = {}; 
	export let isEditing = false;
    
	const dispatch = createEventDispatcher();
	$: dispatch('update', applicationData);

</script>

<div class="form-container">
	
	<div class="info-row">
		<label class="info-label" for="appAcronym">App Acronym:</label>
		{#if isEditing}
			<span class="info-value">{applicationData.App_Acronym}</span>
		{:else}
			<input
				class="info-value"
				type="text"
				id="appAcronym"
				placeholder="App Acronym"
				bind:value={applicationData.App_Acronym}
			/>
		{/if}
	</div>
	

	<div class="info-row">
		<label class="info-label" for="appRnumber">App R-number:</label>
		{#if isEditing}
			<span class="info-value">{applicationData.App_Rnumber}</span>
		{:else}
			<input
				class="info-value"
				type="number"
				id="appRnumber"
				placeholder="App R-number"
				min="1"
				bind:value={applicationData.App_Rnumber}
			/>
		{/if}
	</div>

	<div class="info-row">
		<div class="info-label">
			<label class="info-label" for="appDescription">App Description:</label>
			<br />
		</div>
		<textarea
			class="info-value description-input"
			id="appDescription"
			placeholder="App Description"
			bind:value={applicationData.App_Description}
		/>
	</div>

	<div class="info-row">
		<label class="info-label" for="startDate">Start Date:</label>
		<input
			class="info-value"
			type="date"
			id="startDate"
			bind:value={applicationData.App_startDate}
		/>
	</div>

	<div class="info-row">
		<label class="info-label" for="endDate">End Date:</label>
		<input
			class="info-value"
			type="date"
			id="endDate"
			bind:value={applicationData.App_endDate}
		/>
	</div>

	<div class="info-row">
        <label class="info-label" for="appPermitCreate">App Permit Create:</label>
        <div class="info-select">
            <select
                class="input-value select-box" bind:value={applicationData.App_permit_Create}>
                <option value="" disabled selected>Select Group</option>
                {#each groupList as group}
                    <option value={group}>{group}</option>
                {/each}
        </select>
        </div>
    </div>

    <div class="info-row">
        <label class="info-label" for="appPermitOpen">App Permit Open:</label>
        <div class="info-select">
            <select
                class="input-value select-box" bind:value={applicationData.App_permit_Open}>
                <option value="" disabled selected>Select Group</option>
                {#each groupList as group}
                    <option value={group}>{group}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="info-row">
        <label class="info-label" for="appPermitTodo">App Permit ToDo:</label>
        <div class="info-select">
            <select
                class="input-value select-box" bind:value={applicationData.App_permit_toDoList}>
                <option value="" disabled selected>Select Group</option>
                {#each groupList as group}
                    <option value={group}>{group}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="info-row">
        <label class="info-label" for="appPermitDoing">App Permit Doing:</label>
        <div class="info-select">
            <select
                class="input-value select-box" bind:value={applicationData.App_permit_Doing}>
                <option value="" disabled selected>Select Group</option>
                {#each groupList as group}
                    <option value={group}>{group}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="info-row">
        <label class="info-label" for="appPermitDone">App Permit Done:</label>
        <div class="info-select">
            <select
                class="input-value select-box" bind:value={applicationData.App_permit_Done}>
                <option value="" disabled selected>Select Group</option>
                {#each groupList as group}
                    <option value={group}>{group}</option>
                {/each}
            </select>
        </div>
    </div>
</div>

<style>
    * {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
		'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;
	}
	.form-container {
		border-radius: 8px;
		background: white;
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

	.description-input {
		height: 80px;
		font-size: 16px;
		border: 1px solid #ccc;
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

</style>