<script>
    import { createEventDispatcher } from 'svelte';

    export let username = '';
    export let email = '';
    let showPopup = false;
    let newEmail = '';
    let newPassword = '';     

    const togglePopup = () => {
        showPopup = !showPopup;
    };    

    const handleSave = () => {
        const profileData = { username: username, email: newEmail, password: newPassword };
        dispatch('save', profileData); 

        newEmail = '';
        newPassword = '';
    };

    const dispatch = createEventDispatcher();
</script>

<nav class="navbar">
    <div class="navbar-left">
      <span>{username}</span>
    </div>
    <div class="navbar-center">
      <a href="/applications">Applications</a>
      <a href="/user_management">User Management</a>
    </div>
    <div class="navbar-right">
      <button class="edit-profile-btn" on:click={togglePopup}>Edit Profile</button>
    </div>
  </nav>

  {#if showPopup}
    <div class="popup-overlay">
        <div class="popup">
            <h2>Edit Profile</h2>
            <div class="info-row">
                <span class="info-label">Username:</span>
                <span class="info-value">{username}</span>
              </div>
            <div class="info-row">
                <span class="info-label">Current email:</span>
                <span class="info-value">{email}</span>
              </div>
            <label>
                <span class="info-label">New Email:</span>
                <input class="info-value" type="email" bind:value={newEmail} placeholder="Email" />
            </label>
            <label>
                <span class="info-label">New Password:</span>
                <input class="info-value" type="password" bind:value={newPassword} placeholder="Password"/>
            </label>
            <div class="button-container">
                <button on:click={handleSave}>Save</button>
                <button on:click={togglePopup}>Cancel</button>
            </div>
        </div>
    </div>
{/if}

<style>

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: black;
    color: white;
    padding: 10px 20px;
}

.navbar-left, .navbar-center, .navbar-right {
    display: flex;
    align-items: center;
}

.navbar-center a {
    color: white;
    text-decoration: none;
    margin: 0 15px;
}

.navbar-center a:hover {
    text-decoration: underline;
}

.edit-profile-btn {
    background-color: #555;
    border: none;
    color: white;
    padding: 5px 10px;
    cursor: pointer;
}

.edit-profile-btn:hover {
    background-color: #777;
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
}

.popup {
    background: white;
    padding: 20px;
    border-radius: 5px;
    width: 500px;
}

.popup h2 {
    margin: 0 0 10px;
    text-align: center;
}

.popup label {
    display: flex;
    align-items: center; 
    margin-bottom: 10px;
}

.popup input {
    width: 100%;
    padding: 4px;
    margin-top: 5px;
}

.popup button {
    margin-right: 10px;
    padding: 5px 10px;
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
    }

.button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

</style>
