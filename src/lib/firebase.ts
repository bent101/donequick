// import { getAnalytics } from "firebase/analytics";

import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithRedirect } from "firebase/auth";
import {
	DocumentSnapshot,
	QueryDocumentSnapshot,
	QuerySnapshot,
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	onSnapshot,
	setDoc,
	updateDoc,
	type DocumentData,
} from "firebase/firestore";
import { writable, type Writable } from "svelte/store";

// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
	apiKey: "AIzaSyAqZCp9R0Z-Y8d308vhAPpKW9rUTje_hHo",
	authDomain: "donequick-79f00.firebaseapp.com",
	projectId: "donequick-79f00",
	storageBucket: "donequick-79f00.appspot.com",
	messagingSenderId: "925660515289",
	appId: "1:925660515289:web:a30335f11b7bf8a456a7c8",
	measurementId: "G-448LETTGJX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
export const auth = getAuth(app);

// export const analytics = getAnalytics(app);

// export async function getUserStore() {
// 	await auth.authStateReady();

// 	return writable(auth.currentUser, (set) => {
// 		const unsubscribe = onAuthStateChanged(auth, (user) => set(user));
// 		return unsubscribe;
// 	});
// }

export async function signIn() {
	await signInWithRedirect(auth, new GoogleAuthProvider());
	await auth.authStateReady();
}

export async function signOut() {
	await auth.signOut();
}

export type WithRefAndId<T> = T & { ref: DocumentSnapshot["ref"]; id: DocumentSnapshot["id"] };

function formatDoc<T>(snapshot: DocumentSnapshot | QueryDocumentSnapshot) {
	return {
		ref: snapshot.ref,
		id: snapshot.id,
		...(snapshot.data() as T),
	} as WithRefAndId<T>;
}

function formatCollection<T>(snapshot: QuerySnapshot) {
	return snapshot.docs.map((doc) => formatDoc<T>(doc));
}

export type DocStore<T> = {
	set(val: T): void;
	update(val: T): void;
	delete(): void;
	subscribe: Writable<WithRefAndId<T>>["subscribe"];
};

export async function getDocStore<T extends DocumentData>(path: string): Promise<DocStore<T>> {
	const ref = doc(db, path);

	const curVal = (await getDoc(ref).then((snapshot) => formatDoc<T>(snapshot))) ?? {};

	const { subscribe } = writable(curVal, (set) => {
		const unsubscribe = onSnapshot(ref, (snapshot) => {
			set(formatDoc<T>(snapshot));
		});
		return unsubscribe;
	});

	return {
		/**
		 * will be called when you do $storeName = val (after Svelte actually sets $storeName to val)
		 */
		set(val: T) {
			setDoc(ref, val);
		},
		update(val: T) {
			updateDoc(ref, val);
		},
		delete() {
			deleteDoc(ref);
		},
		subscribe,
	};
}

export type CollectionStore<T> = {
	add(val: T): void;
	subscribe: Writable<WithRefAndId<T>[]>["subscribe"];
};

export async function getCollectionStore<T extends DocumentData>(
	path: string
): Promise<CollectionStore<T>> {
	const ref = collection(db, path);

	const curVal = await getDocs(ref).then((snapshot) => formatCollection<T>(snapshot));

	const { subscribe } = writable(curVal, (set) => {
		const unsubscribe = onSnapshot(ref, (snapshot) => {
			set(formatCollection<T>(snapshot));
		});
		return unsubscribe;
	});

	return {
		add(val: T) {
			addDoc(ref, val);
		},
		subscribe,
	};
}

export async function getUserDocStore<T extends DocumentData>(path: string) {
	return await getDocStore<T>(`users/${auth.currentUser!.uid}/${path}`);
}

export async function getUserCollectionStore<T extends DocumentData>(path: string) {
	return await getCollectionStore<T>(`users/${auth.currentUser!.uid}/${path}`);
}
