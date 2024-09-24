<script>
    //@ts-nocheck
    import { toast, Toaster } from 'svelte-sonner';
    import {accessError, customSuccess} from '../utils/handleError'
  </script>
  
  <Toaster richColors={true}/>
  
  <slot></slot>