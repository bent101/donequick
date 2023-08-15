// import { getAnalytics } from "firebase/analytics";

import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithRedirect } from "firebase/auth";
import {
	DocumentSnapshot,
	QueryConstraint,
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
	query,
	setDoc,
	updateDoc,
	writeBatch,
	type DocumentData,
	DocumentReference,
	CollectionReference,
} from "firebase/firestore";
import { get, writable, type Writable } from "svelte/store";

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

export const db = getFirestore(app);
export const auth = getAuth(app);

// export const analytics = getAnalytics(app);

export function newBatch() {
	return writeBatch(db);
}

export async function signIn() {
	await signInWithRedirect(auth, new GoogleAuthProvider());
	await auth.authStateReady();
	if (!auth.currentUser) throw new Error("failed to sign in");
	return auth.currentUser;
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

	const curVal = await getDoc(ref).then((snapshot) => formatDoc<T>(snapshot));

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

export type CollectionStore<T extends DocumentData> = {
	add(val: T): Promise<DocumentReference<DocumentData, DocumentData>>;
	ref: CollectionReference<DocumentData, DocumentData>;
	subscribe: Writable<WithRefAndId<T>[]>["subscribe"];
};

export async function getCollectionStore<T extends DocumentData>(
	path: string,
	...queryConstraints: QueryConstraint[]
): Promise<CollectionStore<T>> {
	const ref = collection(db, path);
	const queryRef = query(ref, ...queryConstraints);

	const curVal = await getDocs(queryRef).then((snapshot) => formatCollection<T>(snapshot));

	const { subscribe } = writable(curVal, (set) => {
		const unsubscribe = onSnapshot(queryRef, (snapshot) => {
			set(formatCollection<T>(snapshot));
		});
		return unsubscribe;
	});

	return {
		async add(val: T) {
			return await addDoc(ref, val);
		},
		ref,
		subscribe,
	};
}
