// @ts-nocheck
import { goto } from '$app/navigation';
import { toast, Toaster } from 'svelte-sonner';
// import { toastMessage } from '../lib/store';
export function accessError(error) {
	if (error.response && (error.response.status === 403 || error.response.status === 401)) {
		const message = error.response.data?.message || 'Access denied';
		toast.error('Access denied, please log in again');
		goto('/login');
	}
}

export function customSuccess(success) {
	toast.success(`${success}`);
}
