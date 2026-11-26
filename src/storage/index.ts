import { localStore } from './local';
/** The app's one store. Swap for a Supabase implementation of Store when accounts arrive. */
export const store = localStore();
