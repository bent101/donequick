// import { getAnalytics } from "firebase/analytics";

import anon from "$lib/assets/images/anon.jpeg";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, type User } from "firebase/auth";
import {
	addDoc,
	collection,
	CollectionReference,
	deleteDoc,
	doc,
	DocumentReference,
	DocumentSnapshot,
	getDoc,
	getDocs,
	getFirestore,
	onSnapshot,
	query,
	QueryConstraint,
	QueryDocumentSnapshot,
	QuerySnapshot,
	setDoc,
	updateDoc,
	writeBatch,
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

export const db = getFirestore(app);
export const auth = getAuth(app);

// export const analytics = getAnalytics(app);

export function newBatch() {
	return writeBatch(db);
}

export async function deleteCollection(path: string) {
	const batch = newBatch();
	await getDocs(collection(db, path)).then((res) =>
		res.docs.forEach((doc) => {
			batch.delete(doc.ref);
		})
	);
	await batch.commit();
}

export type UserSummary = {
	name: string;
	email: string;
	photoURL: string;
	id: string;
};

export function getUserSummary(user: User): UserSummary {
	const { displayName, uid, photoURL, email } = user;

	return {
		name: displayName ?? "[anonymous user]",
		email: email ?? "",
		photoURL: photoURL ?? anon,
		id: uid,
	};
}

export async function signIn() {
	await signInWithPopup(auth, new GoogleAuthProvider());
	if (!auth.currentUser) throw new Error("failed to sign in");

	setDoc(doc(db, `users/${auth.currentUser.uid}`), getUserSummary(auth.currentUser));
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
	ref: DocumentReference<DocumentData, DocumentData>;
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
		ref,
	};
}

export type CollectionStore<T extends DocumentData> = {
	add(val: T): Promise<DocumentReference<DocumentData, DocumentData>>;
	subscribe: Writable<WithRefAndId<T>[]>["subscribe"];
	ref: CollectionReference<DocumentData, DocumentData>;
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
		subscribe,
		ref,
	};
}
