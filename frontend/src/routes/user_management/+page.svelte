<script>
  // @ts-nocheck
  import axios from '../../lib/axios-config'; 
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { faEdit } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
  import {toast, Toaster} from 'svelte-sonner';

  import Layout from '../+layout.svelte';
  import Nav from '../../components/nav.svelte';
  import Popup from '../../components/popup.svelte';
	import { accessError, customSuccess } from '../../utils/handleError';

  let currentUser = { username: '', email: ''};  

  let newUser = {
    username: '',
    email: '',
    group: [],
    password: '',
    isActive: 'active',
  };

  const resetFields = () => {
    newUser = {
      username: '',
      email: '',
      group: '',
      password: '',
      isActive: 'active',
    };
  };

  onMount(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/user_management', {
        withCredentials: true
      })

      console.log("Response Data:", response.data);
      await handleUsers(); 
      currentUser = response.data;

    } catch (error) {
            if (error.response && error.response.status ) {
                console.log(error.response.data.message || 'An unknown error occurred.');
                toast.error(error.response.data.message || 'An unknown error occurred.');
                accessError(error);
            } else {
                console.log('An unknown error occurred.');
                // goto("/login")
            }
        }
  });

  let accounts = [];
  let userGroups =[];
  let groupList = [];

  const handleUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/accounts', {
        withCredentials: true
      });
      accounts = response.data;

      const groupsResponse = await axios.get('http://localhost:3000/api/usergroups', {
        withCredentials: true
      });
      userGroups = groupsResponse.data;
      groupList = [...new Set(userGroups.map(group => group.user_group))];  
            
      accounts = accounts.map(account => {
        const userGroupsForAccount = userGroups
          .filter(group => group.username === account.username)
          .map(group => group.user_group); 

          const userGroup = userGroupsForAccount.length > 0 ? userGroupsForAccount : [];

          return { ...account, user_group: userGroup };
      });
            
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Error fetching accounts:', error);
    }
  }

  const handleSaveProfile = async (event) => {
        const { username, email, password } = event.detail;        
        try {
            const response = await axios.put(`http://localhost:3000/api/updateUser/${username}`, {
                email,
                password,
            }, {
              withCredentials: true
            });
            await handleUsers();
            customSuccess('Saved Profile')
        } catch (error) {
            if (error.response && error.response.status ) {
                toast.error(error.response.data.message || 'An unknown error occurred.');
                accessError(error);
            } else {
            }
        }
    };

    let showPopup = false;
    const openPopup = () => {
    showPopup = true;
  };

  const closePopup = () => {
    showPopup = false;
  };

  const handleAddGroup = async() => {
    try {
        const response = await axios.post('http://localhost:3000/api/addGroup', {
          groupName
        }, {
          withCredentials: true
        });
        console.log( response.data.message)
        groupName = '';
        closePopup();
        customSuccess('Group Added Successfully')
        await handleUsers(); 
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(error.response.data.message || 'An unknown error occurred.');
          accessError(error);
        }else {
          toast.error('An unknown error occurred.');
        }
      }
    };
    
    let groupName = '';

  function addGroupFrontend(event) {
    const selectedGroup = event.target.value;
    if (selectedGroup && !newUser.group.includes(selectedGroup)) {
      newUser.group = [...newUser.group, selectedGroup]; 
      event.target.value = '';
    }
  }

  const handleAddUser = async () => {
      try {
      const response = await axios.post('http://localhost:3000/api/addUser', {
        newUser
      }, {
        withCredentials: true
      });      

      resetFields(); 
      customSuccess('User Added Successfully')  
      await handleUsers();       
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || 'An unknown error occurred.');
        accessError(error);
      }else {
        toast.error('An unknown error occurred.');
      }
    }
  };

  let editingUser = null;
  let editedUser = {};
  let originalUser ={}

  function startEditing(user) {    
    editingUser = user;
    editedUser = { 
      ...user,
      group: [...user.user_group],
      password: ''
     };     
  }

  function cancelEditing() {
    editedUser = { ...originalUser };
    editingUser = null; 
  }

  function editGroupFrontend(event) {
    const selectedGroup = event.target.value;    

    if (selectedGroup) {
      if (!editedUser.group.includes(selectedGroup)) {
        editedUser.group = [...editedUser.group, selectedGroup];
      }
      event.target.value = '';
  }

  }

  function removeGroupFrontend(index) {
    if (newUser.group.length > 0) {
      newUser.group = newUser.group.filter(group => group !== index)
    } else {
      editedUser.group = editedUser.group.filter(group => group !== index);      
    }
  }

  const handleEditUser = async () => {       
    try {      
      const response = await axios.put(`http://localhost:3000/api/editUser/${editedUser.username}`, {
        editedUser
      }, {
        withCredentials: true
      });
      customSuccess('User Edited Successfully')
      originalUser = { ...editedUser };
      await handleUsers();
      editingUser = null; 
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

<Nav username={currentUser.username} email={currentUser.email} on:save={handleSaveProfile} />
<body>
<div> 
  <div class="header">
    <h1>User Management</h1>
    <button class="action2-btn" on:click={openPopup}>+ Create Group</button>
  </div>
  <Popup show={showPopup} onClose={closePopup}>
    <span slot="header">Add Group</span>
    <div class="info-row" slot="body">
      <span class="info-label">Group Name:</span>
      <input class="info-value" 
      type="text" 
      id="group" 
      placeholder="Group" 
      bind:value={groupName} />
    </div>
    <div slot="buttons">
      <button class="action2-btn" on:click={handleAddGroup}>Add Group</button>
    </div>
  </Popup>

    <table>
      <thead >
        <tr >
          <th class="table-header">Username</th>
          <th class="table-header">Email</th>
          <th class="table-header">Group</th>
          <th class="table-header">Password</th>
          <th class="table-header">isActive</th>
          <th class="table-header">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input class="input-field" placeholder="Username" bind:value={newUser.username} /></td>
          <td><input class="input-field" placeholder="Email" bind:value={newUser.email} /></td>
            <td >
              <select class="input-field" on:change={addGroupFrontend}>
                <option value="" disabled selected>Select Group</option>
                {#each groupList as group}
                  <option value={group}>{group}</option>
                {/each}
              </select>
            
              <div class="scrollable-column">
                {#each newUser.group as group}
                  <button class="tag" on:click={() => removeGroupFrontend(group)}>
                    <p>{group}</p>
                    <p>x</p>
                  </button>                  
                {/each}
              </div>
            </td>
            
          <td><input class="input-field" placeholder="Password" type="password" bind:value={newUser.password} /></td>
          <td>
            <select class="input-field" bind:value={newUser.isActive}>
              <option value="active" >Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </td>
          <td><button class="action2-btn" on:click={handleAddUser}>Add User</button></td>
        </tr>
        {#each accounts as user, index}
        <tr>
          {#if editingUser && editingUser.username === user.username}
            <td><span class="input-field" >{user.username}</span></td>
            <td><input class="input-field"type="email" bind:value={editedUser.email} placeholder="New Email"/></td>
            <td >
              <select class="input-field" on:change={editGroupFrontend}>
                <option value="" disabled selected >Select Group</option>
                {#each groupList as group}
                  <option value={group}>{group}</option>
                {/each}
              </select>
              <div class="scrollable-column">
                {#each editedUser.group as group }
                  <button class="tag" on:click={() => removeGroupFrontend(group)}>
                    <p>{group}</p>
                    <p>x</p>
                  </button>                  
                {/each}
              </div>
            </td>
            
            <td><input class="input-field" type="password" placeholder="New Password" bind:value={editedUser.password} /></td>
            <td><select class="input-field" bind:value={editedUser.isActive}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select></td>
            <td>
              <button class="action2-btn" on:click={handleEditUser}>Save</button>
              <button class="action2-btn" on:click={cancelEditing}>Cancel</button>
            </td>
          {:else}
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>
              {#if Array.isArray(user.user_group)}
                {#each user.user_group as group}
                  <span class="tag">{group}</span>
                {/each}
              {:else}
                <span class="tag">{user.user_group}</span>
              {/if}
            </td>
            <td>********</td>
            <td>{user.isActive}</td>
            {#if user.username !== 'admin'}

                <td><button class="action-btn" on:click={() => startEditing(user)}><FontAwesomeIcon icon={faEdit} /></button></td>
            {/if}
          {/if}
        </tr>
        {/each}
        
      </tbody>
    </table>
</div>
</body>

<style>
  * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial,
        sans-serif;
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

  .table-header {
    background-color: #EFF4FA;
    height: 30px;
  }

  .input-field {
    width: 100%;
    padding: 5px;
    box-sizing: border-box;
  }

  .action2-btn {
    background-color: black;
    color: white;
    padding: 8px 12px;
    border: none;
    cursor: pointer;
  }

  .action-btn {
    background-color: white;
    color: black;
    padding: 8px 12px;
    border: none;
    cursor: pointer;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
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

  .scrollable-column {
    width: 250px; 
    max-height: 100px; 
    overflow-y: auto; 
    overflow-x: hidden; 
    padding: 10px; 
    border: none; 
    display: flex;
    flex-direction: column; 
  }

  .tag {
    display: flex;
    justify-content: space-between;
    background-color: #e0e0e0;
    border: none;
    color: #333;
    padding: 7px 10px;
    margin: 5px 5px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  p {
    margin: 0px;
    cursor: pointer;
  }

</style>