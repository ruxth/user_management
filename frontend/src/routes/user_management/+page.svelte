<script>
  // @ts-nocheck
  import axios from '../../lib/axios-config'; 
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  import {getCookie, deleteCookie} from '../../utils/cookies'
  import Nav from '../../components/nav.svelte'
  import Popup from '../../components/popup.svelte';

  let newUser = {
    username: '',
    email: '',
    group: [],
    password: '',
    isActive: 'Active',
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
    await handleUserInfo();
    await handleUsers();    
  });

  let accounts = [];
  let userGroups =[];
  let groupList = []

  export const handleUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/accounts');
      accounts = response.data;

      const groupsResponse = await axios.get('http://localhost:3000/api/usergroups');
      userGroups = groupsResponse.data;
      groupList = [...new Set(userGroups.map(group => group.user_group))];  
            
      accounts = accounts.map(account => {
        const userGroupsForAccount = userGroups
          .filter(group => group.username === account.username)
          .map(group => group.user_group); 

          const userGroup = userGroupsForAccount.length > 0 ? userGroupsForAccount : ['No groups'];

          return { ...account, user_group: userGroup };
      });      

      console.log(accounts);
      

    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }

  let currentUser = { username: '', email: ''};  

  export const handleUserInfo = async () => {
    const token = getCookie('authToken');

    try {
      const response = await axios.get('http://localhost:3000/api/user-info', {
      headers: {
        'x-access-token': token
        }
      });

      currentUser = response.data;
      console.log('User:', response.data);

    }catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data.message || 'An unknown error occurred.');
        deleteCookie('authToken'); 
        goto('/login'); 
      }else {
        console.log('An unknown error occurred.');

      }
    }
  };

  export const handleSaveProfile = async (event) => {
        const { username, email, password } = event.detail;        
        try {
            const response = await axios.put(`http://localhost:3000/api/updateUser/${username}`, {
                email,
                password,
            });

            await handleUserInfo();
        } catch (error) {
            if (error.response && error.response.data) {
                console.log(error.response.data.message || 'An unknown error occurred.');
            } else {
                console.log('An unknown error occurred.');
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

  export const handleAddGroup = async() => {
    try {
        const response = await axios.post('http://localhost:3000/api/addGroup', {
          groupName
        });
        console.log( response.data.message)
        groupName = '';
      } catch (error) {
        if (error.response && error.response.data) {
          console.log(error.response.data.message || 'An unknown error occurred.');
        }else {
          console.log('An unknown error occurred.');

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

  export const handleAdd = async () => {
      try {
      const response = await axios.post('http://localhost:3000/api/addUser', {
        newUser
      });

      resetFields();   
      await handleUsers();       
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data.message || 'An unknown error occurred.');
      }else {
        console.log('An unknown error occurred.');

      }
    }
  };

  let editingUser = null;
  let editedUser = {};
  let originalUser =[]

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
    
    if (selectedGroup && editingUser.user_group.includes(selectedGroup)) {
      console.log('Group already added.');
      event.target.value = ''; 
    } else {
      editedUser.group = [...editingUser.user_group, selectedGroup]; 
      event.target.value = ''; 
    }
  }

  async function saveChanges() {   
    try {      
      const response = await axios.put(`http://localhost:3000/api/editUser/${editedUser.username}`, {
        editedUser
      });
      handleUsers();
      editingUser = null; 
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data.message || 'An unknown error occurred.');
      }else {
        console.log('An unknown error occurred.');

      }
    }
  }
    
</script>

<Nav username={currentUser.username} email={currentUser.email} on:save={handleSaveProfile}/>

<div> 
  <td><button on:click={openPopup}>Create Group</button></td>
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
      <button class="popup-button" on:click={handleAddGroup}>Add Group</button>
    </div>
  </Popup>

    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Group</th>
          <th>Password</th>
          <th>isActive</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input class="input-field" placeholder="username" bind:value={newUser.username} /></td>
          <td><input class="input-field" placeholder="Email" bind:value={newUser.email} /></td>
          <td>
            <select class="input-field" on:change={addGroupFrontend}>
              <option value="" disabled selected >Select Group</option>
              {#each groupList as group}
                <option value={group}>{group}</option>
              {/each}
            </select>
                {#each newUser.group as group }
                  <span  class="tag">{group}</span>
                {/each}
            </td>
          <td><input class="input-field" placeholder="Password" type="password" bind:value={newUser.password} /></td>
          <td>
            <select class="input-field" bind:value={newUser.isActive}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </td>
          <td><button class="action-btn" on:click={handleAdd}>Add User</button></td>
        </tr>
        {#each accounts as user, index}
        <tr>
          {#if editingUser && editingUser.username === user.username}
            <td><span class="input-field" >{user.username}</span></td>
            <td><input class="input-field"type="email" bind:value={editedUser.email} placeholder="New Email"/></td>
            <td>
              <select class="input-field" on:change={editGroupFrontend}>
                <option value="" disabled selected >Select Group</option>
                {#each groupList as group}
                  <option value={group}>{group}</option>
                {/each}
              </select>
                  {#each editedUser.group as group }
                    <span  class="tag">{group}</span>
                  {/each}
            </td>
            
            <td><input class="input-field" type="password" placeholder="New Password" bind:value={editedUser.password} /></td>
            <td><select class="input-field" bind:value={editedUser.isActive}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select></td>
            <td>
              <button class="action-btn" on:click={saveChanges}>Save</button>
              <button class="action-btn" on:click={cancelEditing}>Cancel</button>
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
            <td><button class="action-btn" on:click={() => startEditing(user)}>Edit</button></td>
          {/if}
        </tr>
        {/each}
        
      </tbody>
    </table>
</div>

<style>
  .input-field {
    width: 100%;
    padding: 5px;
    box-sizing: border-box;
  }

  .action-btn {
    background-color: #4CAF50;
    color: white;
    padding: 8px 12px;
    border: none;
    cursor: pointer;
  }

  .action-btn:hover {
    background-color: #45a049;
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

  .popup-button {
    margin-right: 10px;
    padding: 5px 10px;
    cursor: pointer;
  }

  .tag {
    display: inline-block;
    background-color: #e0e0e0;
    color: #333;
    padding: 5px 10px;
    margin-right: 5px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

</style>