<script>
    export let show = false;
    export let onClose = () => {};
    
    const closePopup = () => {
      onClose();
    };
  </script>
  
  {#if show}
    <div class="popup-overlay" >
      <div class="popup" >
        <h2 class="popup-header">
          <slot name="header">Default Header</slot>
        </h2>
        <div class="popup-body">
          <slot name="body">Default body content</slot>
        </div>
        <div class="popup-close">
            <slot name="buttons">Default button content</slot>
            <button on:click={closePopup}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
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
  
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      justify-content: center;
    }
  
    .popup-close {
        display: flex;
        justify-content: center;
        cursor: pointer;
        margin-top: 30px;
    }
  
  </style>
  